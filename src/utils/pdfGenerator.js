/**
 * pdfGenerator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Core PDF compilation pipeline.
 *
 * Flow:
 *  1. Detect device profile (mobile / tablet / desktop)
 *  2. Show large-batch warning if needed
 *  3. Process each image one-at-a-time (never all in memory simultaneously)
 *  4. Embed into PDF, release image buffer immediately after embedding
 *  5. Draw layout, margins, watermark
 *  6. Save + return Blob
 *
 * Progress callback receives both a numeric value (0–100) and a status label
 * so the UI can show human-readable messages.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { processImageForPDF } from './imageUtils';
import { getDeviceProfile } from './deviceProfile';

/** Page sizes in PDF points (72 pt = 1 inch) */
const PAGE_SIZES = {
  a4:     { width: 595.27, height: 841.89 },
  letter: { width: 612,    height: 792    },
  legal:  { width: 612,    height: 1008   },
  a5:     { width: 419.53, height: 595.27 },
};

/** Margin values in points */
const MARGINS = { none: 0, small: 18, medium: 36, large: 54 };

// ── Progress helper ───────────────────────────────────────────────────────────
const PHASES = {
  prepare:  { label: 'Preparing images…',   start: 0,  end: 5  },
  process:  { label: 'Optimizing images…',  start: 5,  end: 82 },
  build:    { label: 'Building PDF…',       start: 82, end: 92 },
  finalize: { label: 'Finalizing PDF…',     start: 92, end: 100 },
};

/**
 * Interpolates a progress value within a phase range.
 * @param {'prepare'|'process'|'build'|'finalize'} phase
 * @param {number} t – 0…1 within that phase
 */
function phaseProgress(phase, t = 0) {
  const { start, end, label } = PHASES[phase];
  return { value: Math.round(start + (end - start) * t), label };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generates a PDF Blob from the provided image list and settings.
 *
 * @param {object[]}  images        – store image records
 * @param {object}    settings      – user PDF settings from store
 * @param {Function}  onProgress    – (value: number, label: string) => void
 * @param {Function}  [onWarning]   – (message: string) => void  (optional)
 * @returns {Promise<Blob>}
 */
export const generatePDF = async (images, settings, onProgress, onWarning) => {
  // ── 1. Device detection ─────────────────────────────────────────────────
  const device = getDeviceProfile();
  const total  = images.length;

  const emit = ({ value, label }) => onProgress(value, label);

  emit(phaseProgress('prepare'));

  // ── 2. Large-batch warning ──────────────────────────────────────────────
  if (total > device.batchWarningThreshold && typeof onWarning === 'function') {
    onWarning(
      `Large document detected (${total} pages). ` +
      `PDF Pro is optimizing your images for the best performance on this device.`
    );
  }

  // ── 3. PDF document setup ───────────────────────────────────────────────
  const pdfDoc          = await PDFDocument.create();
  const helveticaBold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // ── 4. Image processing loop (one image at a time) ──────────────────────
  for (let i = 0; i < total; i++) {
    const imageObj = images[i];

    // Emit smooth per-image progress inside the process phase
    emit(phaseProgress('process', i / total));

    // ── Process image with per-image error recovery ───────────────────────
    let imgBytes;
    try {
      imgBytes = await processImageForPDF(
        imageObj,
        device,
        settings.quality,
        settings.compress,
      );
    } catch (primaryErr) {
      // First recovery: reduce quality & maxDim by 25% and retry once
      console.warn(`[PDF Pro] Image "${imageObj.name}" failed, retrying with reduced quality.`, primaryErr);
      if (typeof onWarning === 'function') {
        onWarning('Device memory is low. PDF Pro is reducing image resolution automatically.');
      }
      try {
        const degradedDevice = {
          ...device,
          quality: Math.max(device.quality * 0.75, 0.55),
          maxDim:  Math.round(device.maxDim  * 0.75),
          aggressiveMemory: true,
        };
        imgBytes = await processImageForPDF(imageObj, degradedDevice, 'medium', true);
      } catch (recoveryErr) {
        console.error(`[PDF Pro] Image "${imageObj.name}" unrecoverable. Skipping.`, recoveryErr);
        if (typeof onWarning === 'function') {
          onWarning(`Unable to process image "${imageObj.name}". Skipping and continuing.`);
        }
        continue; // skip this image rather than crashing the whole job
      }
    }

    // ── Embed into PDF ────────────────────────────────────────────────────
    const pdfImg   = await pdfDoc.embedJpg(imgBytes);
    const imgWidth = pdfImg.width;
    const imgHeight= pdfImg.height;

    // ── Release imgBytes from JS heap immediately ─────────────────────────
    // Nulling the local reference allows the GC to collect the Uint8Array.
    // Critical on mobile where each processed image can be 1–5 MB.
    imgBytes = null;

    // ── Page sizing ───────────────────────────────────────────────────────
    const baseSize = PAGE_SIZES[settings.pageSize] ?? PAGE_SIZES.a4;
    const margin   = MARGINS[settings.margin] ?? 0;

    let pageWidth, pageHeight;

    if (settings.layout === 'original') {
      pageWidth  = imgWidth  + margin * 2;
      pageHeight = imgHeight + margin * 2;
    } else if (settings.layout === 'smart') {
      const isLandscape = imgWidth > imgHeight;
      pageWidth  = isLandscape ? Math.max(baseSize.width, baseSize.height) : Math.min(baseSize.width, baseSize.height);
      pageHeight = isLandscape ? Math.min(baseSize.width, baseSize.height) : Math.max(baseSize.width, baseSize.height);
    } else {
      const isLandscape = settings.orientation === 'landscape';
      pageWidth  = isLandscape ? Math.max(baseSize.width, baseSize.height) : Math.min(baseSize.width, baseSize.height);
      pageHeight = isLandscape ? Math.min(baseSize.width, baseSize.height) : Math.max(baseSize.width, baseSize.height);
    }

    const page          = pdfDoc.addPage([pageWidth, pageHeight]);
    const drawAreaW     = pageWidth  - margin * 2;
    const drawAreaH     = pageHeight - margin * 2;

    let drawW = drawAreaW, drawH = drawAreaH;
    let drawX = margin,    drawY = margin;

    // ── Layout calculations ───────────────────────────────────────────────
    if (settings.layout === 'fit' || settings.layout === 'smart') {
      const imgRatio  = imgWidth / imgHeight;
      const pageRatio = drawAreaW / drawAreaH;
      if (imgRatio > pageRatio) {
        drawW = drawAreaW;
        drawH = drawAreaW / imgRatio;
      } else {
        drawH = drawAreaH;
        drawW = drawAreaH * imgRatio;
      }
      drawX = margin + (drawAreaW - drawW) / 2;
      drawY = margin + (drawAreaH - drawH) / 2;

    } else if (settings.layout === 'fill') {
      const imgRatio  = imgWidth / imgHeight;
      const pageRatio = drawAreaW / drawAreaH;
      if (imgRatio > pageRatio) {
        drawH = drawAreaH;
        drawW = drawAreaH * imgRatio;
        drawX = margin + (drawAreaW - drawW) / 2;
        drawY = margin;
      } else {
        drawW = drawAreaW;
        drawH = drawAreaW / imgRatio;
        drawX = margin;
        drawY = margin + (drawAreaH - drawH) / 2;
      }

    } else if (settings.layout === 'original') {
      drawW = imgWidth;
      drawH = imgHeight;
      drawX = margin;
      drawY = margin;
    }

    // ── Draw image ────────────────────────────────────────────────────────
    const crop = imageObj.crop;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = imgWidth;
    let sourceHeight = imgHeight;

    if (crop && crop.width && crop.height) {
      const scaleX = imgWidth / crop.width;
      const scaleY = imgHeight / crop.height;
      sourceX = crop.x * scaleX;
      sourceY = crop.y * scaleY;
      sourceWidth = crop.width * scaleX;
      sourceHeight = crop.height * scaleY;
    }

    page.drawImage(pdfImg, {
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH,
      srcX: sourceX,
      srcY: sourceY,
      srcWidth: sourceWidth,
      srcHeight: sourceHeight,
    });

    // ── Fill-layout margin masks ──────────────────────────────────────────
    if (margin > 0 && settings.layout === 'fill') {
      const white = rgb(1, 1, 1);
      page.drawRectangle({ x: 0,                y: pageHeight - margin, width: pageWidth, height: margin,    color: white });
      page.drawRectangle({ x: 0,                y: 0,                  width: pageWidth, height: margin,    color: white });
      page.drawRectangle({ x: 0,                y: 0,                  width: margin,    height: pageHeight, color: white });
      page.drawRectangle({ x: pageWidth - margin, y: 0,                width: margin,    height: pageHeight, color: white });
    }

    // ── Watermark ─────────────────────────────────────────────────────────
    if (settings.watermarkEnabled) {
      const fontSize = 9;
      const opacity  = 0.6;

      const madeWith  = 'Made with ';
      const pdfText   = 'PDF';
      const proText   = 'PRO';
      const madeW     = helveticaBold.widthOfTextAtSize(madeWith, fontSize);
      const pdfW      = helveticaBold.widthOfTextAtSize(pdfText,  fontSize);
      const spaceW    = helveticaBold.widthOfTextAtSize(' ',       fontSize);
      const totalW    = madeW + pdfW + spaceW + helveticaBold.widthOfTextAtSize(proText, fontSize);
      const wPad      = 12;
      const wX        = pageWidth - margin - wPad - totalW;
      const wY        = margin + wPad;

      page.drawText(madeWith, { x: wX,          y: wY, size: fontSize, font: helveticaBold, color: rgb(0.45, 0.45, 0.45), opacity });
      page.drawText(pdfText,  { x: wX + madeW,  y: wY, size: fontSize, font: helveticaBold, color: rgb(1, 1, 1),          opacity });
      page.drawText(proText,  { x: wX + madeW + pdfW + spaceW, y: wY, size: fontSize, font: helveticaBold, color: rgb(225/255, 29/255, 72/255), opacity });
    }

    // ── Aggressive memory: yield to event loop every image on mobile ──────
    if (device.aggressiveMemory) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  // ── 5. Save ──────────────────────────────────────────────────────────────
  emit(phaseProgress('build', 0));
  const pdfBytes = await pdfDoc.save();

  emit(phaseProgress('finalize', 0.5));

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  emit(phaseProgress('finalize', 1));

  return blob;
};
