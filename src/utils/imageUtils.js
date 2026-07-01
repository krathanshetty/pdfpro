/**
 * imageUtils.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Image pre-processing helpers for the PDF generation pipeline.
 * Accepts a DeviceProfile from deviceProfile.js and the user's manual settings
 * to determine the final quality / max-dimension constraints.
 */

import imageCompression from 'browser-image-compression';

/**
 * Formats a file size in bytes to a human-readable string (KB, MB).
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Resolves the effective quality (0–1) and maxDim (px) to use for an image,
 * merging the device profile defaults with the user's manual quality setting.
 *
 * User setting always wins on desktop; on mobile/tablet the device profile
 * acts as a ceiling to protect memory.
 *
 * @param {import('./deviceProfile').DeviceProfile} deviceProfile
 * @param {string} qualitySetting  – 'original' | 'high' | 'medium' | 'low'
 * @param {boolean} compressToggle – user's compress toggle
 * @returns {{ quality: number, maxDim: number }}
 */
function resolveConstraints(deviceProfile, qualitySetting, compressToggle) {
  // User-specified quality map
  const qualityMap = {
    original: { quality: 0.98, maxDim: Infinity },
    high:     { quality: 0.92, maxDim: 3000 },
    medium:   { quality: 0.78, maxDim: 1800 },
    low:      { quality: 0.55, maxDim: 1000 },
  };

  let { quality, maxDim } = qualityMap[qualitySetting] ?? qualityMap.high;

  // If the user toggled compress, override quality downward
  if (compressToggle) {
    quality = Math.min(quality, 0.68);
    maxDim  = Math.min(maxDim,  1200);
  }

  // Apply device profile ceiling — protects memory on mobile/tablet
  quality = Math.min(quality, deviceProfile.quality);
  maxDim  = Math.min(maxDim,  deviceProfile.maxDim);

  return { quality, maxDim };
}

/**
 * Loads an image from a URL and processes it on an offscreen canvas.
 *
 * Responsibilities:
 *  - Swap dimensions when rotation is 90 / 270°
 *  - Apply rotation
 *  - Resize to fit within maxDim (aspect-ratio preserved)
 *  - Fill white background (transparent PNG/WEBP → JPEG)
 *  - Return a Uint8Array JPEG buffer for pdf-lib
 *
 * The canvas is explicitly removed from the DOM after use so the GC can
 * reclaim its backing store quickly on low-memory devices.
 *
 * @param {object} imageObj        – store image record  { url, rotation, … }
 * @param {import('./deviceProfile').DeviceProfile} deviceProfile
 * @param {string}  qualitySetting – 'original' | 'high' | 'medium' | 'low'
 * @param {boolean} compressToggle – user compress toggle
 * @returns {Promise<Uint8Array>}
 */
export const processImageForPDF = async (imageObj, deviceProfile, qualitySetting = 'high', compressToggle = false) => {
  const { quality, maxDim } = resolveConstraints(deviceProfile, qualitySetting, compressToggle);
  const shouldPrecompress = deviceProfile.deviceClass !== 'desktop' || compressToggle || qualitySetting === 'low';

  const sourceBlob = imageObj.file instanceof Blob ? imageObj.file : null;
  const sourceCandidates = [];
  let temporaryUrl = null;
  let fallbackBlob = null;

  if (sourceBlob) {
    sourceCandidates.push(sourceBlob);
  }

  if (imageObj.url && !sourceBlob) {
    sourceCandidates.push(imageObj.url);
  }

  if (shouldPrecompress && sourceBlob) {
    try {
      const originalMB = sourceBlob.size / (1024 * 1024);
      const maxSizeMB = Math.min(1.0, Math.max(0.25, originalMB * 0.3));
      const compressedFile = await imageCompression(sourceBlob, {
        maxSizeMB,
        maxWidthOrHeight: Math.min(maxDim, deviceProfile.deviceClass === 'mobile' ? 1100 : 1600),
        useWebWorker: true,
        initialQuality: Math.max(0.5, quality - 0.15),
        fileType: 'image/jpeg',
      });

      if (compressedFile.size > 0 && compressedFile.size < sourceBlob.size) {
        temporaryUrl = URL.createObjectURL(compressedFile);
        fallbackBlob = compressedFile;
        sourceCandidates.unshift(temporaryUrl);
      }
    } catch (err) {
      console.warn('[PDF Pro] Pre-compression skipped for image.', err);
    }
  }

  const loadImageWithUrl = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${imageObj.name ?? 'unknown'}`));
    img.src = src;
  });

  const loadImageWithBitmap = async (blob) => {
    if (typeof window === 'undefined' || typeof window.createImageBitmap !== 'function') {
      throw new Error('createImageBitmap is not available');
    }
    return window.createImageBitmap(blob);
  };

  let img = null;
  let bitmap = null;
  let loadedSrc = null;

  try {
    for (const src of sourceCandidates) {
      try {
        img = await loadImageWithUrl(src);
        loadedSrc = src;
        break;
      } catch (err) {
        img = null;
      }
    }

    if (!img && fallbackBlob) {
      bitmap = await loadImageWithBitmap(fallbackBlob);
    } else if (!img && imageObj.file instanceof Blob) {
      bitmap = await loadImageWithBitmap(imageObj.file);
    }
  } catch (err) {
    if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
    throw err;
  }

  if (!img && !bitmap) {
    if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
    throw new Error(`Failed to decode image: ${imageObj.name ?? 'unknown'}`);
  }

  let canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
    if (bitmap && typeof bitmap.close === 'function') bitmap.close();
    throw new Error('Failed to get canvas context');
  }

  try {
    const rotation  = imageObj.rotation || 0;
    const flipX = imageObj.flipX || false;
    const flipY = imageObj.flipY || false;
    const isSwapped = rotation === 90 || rotation === 270;

    const origW = bitmap ? bitmap.width : img.naturalWidth;
    const origH = bitmap ? bitmap.height : img.naturalHeight;

    const crop = imageObj.crop;
    const cropX = crop ? Math.round((crop.x || 0) * origW) : 0;
    const cropY = crop ? Math.round((crop.y || 0) * origH) : 0;
    const cropW = crop ? Math.max(1, Math.round((crop.width || 1) * origW)) : origW;
    const cropH = crop ? Math.max(1, Math.round((crop.height || 1) * origH)) : origH;

    let targetW = isSwapped ? cropH : cropW;
    let targetH = isSwapped ? cropW : cropH;

    if (targetW > maxDim || targetH > maxDim) {
      const ratio = Math.min(maxDim / targetW, maxDim / targetH);
      targetW = Math.round(targetW * ratio);
      targetH = Math.round(targetH * ratio);
    }

    canvas.width  = targetW;
    canvas.height = targetH;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);

    ctx.translate(targetW / 2, targetH / 2);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.rotate((rotation * Math.PI) / 180);

    const drawW = isSwapped ? targetH : targetW;
    const drawH = isSwapped ? targetW : targetH;
    ctx.drawImage(bitmap ?? img, cropX, cropY, cropW, cropH, -drawW / 2, -drawH / 2, drawW, drawH);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error('Canvas toBlob conversion failed'));
          return;
        }
        resolve(result);
      }, 'image/jpeg', quality);
    });

    const buffer = new Uint8Array(await blob.arrayBuffer());

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 1;
    canvas.height = 1;
    canvas = null;

    if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
    if (bitmap && typeof bitmap.close === 'function') bitmap.close();
    if (img) {
      img.onload = null;
      img.onerror = null;
    }

    return buffer;
  } catch (err) {
    if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
    if (bitmap && typeof bitmap.close === 'function') bitmap.close();
    if (img) {
      img.onload = null;
      img.onerror = null;
    }
    throw err;
  }
};
