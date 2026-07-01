import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZoomIn, FiZoomOut, FiMaximize, FiChevronLeft, FiChevronRight, FiEye } from 'react-icons/fi';
import { usePDFStore } from '../store/usePDFStore';

export default function PreviewPanel() {
  const images = usePDFStore((state) => state.images);
  const pdfSettings = usePDFStore((state) => state.pdfSettings);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);


  if (images.length === 0) {
    return (
      <div className="w-full bg-brand-card rounded-brand border border-white/5 p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-brand-text-muted mb-4">
          <FiEye className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Live Preview</h3>
        <p className="text-sm text-brand-text-muted max-w-xs">
          Upload images to view a live, real-time preview of your generated PDF.
        </p>
      </div>
    );
  }

  // Adjust active page index if it goes out of bounds
  const activePageIndex = Math.min(currentPage, images.length - 1);
  const activeImage = images[activePageIndex];

  // Map settings to CSS properties
  const marginsClass = {
    none: 'p-0',
    small: 'p-[3%]',
    medium: 'p-[6%]',
    large: 'p-[9%]',
  }[pdfSettings.margin] || 'p-0';

  // Calculate paper aspect ratio
  let aspectStyle = {};
  const isLandscape = pdfSettings.orientation === 'landscape';
  
  if (pdfSettings.layout === 'original') {
    // Page aspect ratio matches image aspect ratio with rotation-aware dimensions
    if (activeImage) {
      const rotation = activeImage.rotation ?? 0;
      const rotated = rotation % 180 !== 0;
      const width = rotated ? activeImage.height : activeImage.width;
      const height = rotated ? activeImage.width : activeImage.height;
      aspectStyle = { aspectRatio: `${width} / ${height}` };
    }
  } else if (pdfSettings.layout === 'smart') {
    // Aspect ratio swaps depending on active image orientation
    if (activeImage) {
      const isImgLandscape = activeImage.width > activeImage.height;
      const sizeRatio = {
        a4: 1.414,
        letter: 1.294,
        legal: 1.647,
        a5: 1.414,
      }[pdfSettings.pageSize] || 1.414;

      aspectStyle = { aspectRatio: isImgLandscape ? `${sizeRatio} / 1` : `1 / ${sizeRatio}` };
    }
  } else {
    // Normal aspect ratios
    const sizeRatio = {
      a4: 1.414,
      letter: 1.294,
      legal: 1.647,
      a5: 1.414,
    }[pdfSettings.pageSize] || 1.414;

    aspectStyle = { aspectRatio: isLandscape ? `${sizeRatio} / 1` : `1 / ${sizeRatio}` };
  }

  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 0.15, 1.5));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 0.15, 0.6));
  const handleZoomReset = () => setZoomScale(1);

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, images.length - 1));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 0));

  return (
    <div className="w-full bg-brand-card rounded-brand border border-white/5 p-4 sm:p-6 flex flex-col items-center justify-between space-y-4 sm:space-y-6">
      {/* Header & Controls */}
      <div className="w-full flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <FiEye className="w-5 h-5 text-brand-accent" />
          <h3 className="text-lg font-bold text-white">Live PDF Preview</h3>
        </div>
        {/* Zoom Toolset */}
        <div className="flex items-center gap-1.5 bg-neutral-900 border border-white/5 rounded-lg p-1">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded text-brand-text-muted hover:text-white hover:bg-white/5 transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out Preview"
          >
            <FiZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomReset}
            className="px-2 py-0.5 text-xs font-semibold rounded text-brand-text-muted hover:text-white hover:bg-white/5 transition-colors"
            title="Reset Zoom"
            aria-label="Reset Preview Zoom"
          >
            {Math.round(zoomScale * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded text-brand-text-muted hover:text-white hover:bg-white/5 transition-colors"
            title="Zoom In"
            aria-label="Zoom In Preview"
          >
            <FiZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="w-full overflow-hidden flex items-center justify-center min-h-[300px] sm:min-h-[360px] max-h-[440px] bg-neutral-900 border border-white/5 rounded-2xl relative p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {activeImage && (
            <motion.div
              key={`${activeImage.id}-${pdfSettings.pageSize}-${pdfSettings.orientation}-${pdfSettings.margin}-${pdfSettings.layout}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: zoomScale }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              style={{
                ...aspectStyle,
                maxHeight: '380px',
                width: '100%',
              }}
              className="bg-white rounded-sm shadow-[0_12px_40px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col relative select-none"
            >
              {/* Paper Layout Canvas */}
              <div className={`w-full h-full flex-1 flex items-center justify-center relative ${marginsClass}`}>
                {/* Visual margin border guide (dotted line) */}
                {pdfSettings.margin !== 'none' && (
                  <div className="absolute inset-0 border border-dashed border-neutral-300 pointer-events-none opacity-40 m-[3%] rounded-sm"></div>
                )}
                
                {/* Main page image */}
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-300"
                  style={{ transform: `rotate(${activeImage.rotation}deg)` }}
                >
                  <img
                    src={activeImage.url}
                    alt="Page preview"
                    className={`max-w-full max-h-full rounded-sm ${
                      pdfSettings.layout === 'fill' ? 'w-full h-full object-cover' : 'object-contain'
                    }`}
                  />
                </div>

                {/* Live Watermark Preview */}
                {pdfSettings.watermarkEnabled && (
                  <div
                    className="absolute bottom-3 right-3 pointer-events-none z-30 select-none font-sans font-bold tracking-wider whitespace-nowrap"
                    style={{
                      opacity: 0.6,
                      fontSize: '9px',
                    }}
                  >
                    <span className="text-[#737373]">Made with </span>
                    <span className="text-[#ffffff]">PDF</span>
                    <span className="text-[#E11D48]"> PRO</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination & Indicator Toolbar */}
      <div className="w-full flex items-center justify-between pt-3 sm:pt-4 border-t border-white/5">
        <button
          onClick={prevPage}
          disabled={activePageIndex === 0}
          className="flex items-center justify-center p-2.5 rounded-xl bg-neutral-900 border border-white/5 text-white hover:bg-brand-accent hover:border-brand-accent disabled:opacity-30 disabled:hover:bg-neutral-900 disabled:hover:border-white/5 transition-all min-h-[48px] min-w-[48px]"
          aria-label="Previous Preview Page"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-sm font-semibold text-white">
          Page {activePageIndex + 1} of {images.length}
        </span>

        <button
          onClick={nextPage}
          disabled={activePageIndex === images.length - 1}
          className="flex items-center justify-center p-2.5 rounded-xl bg-neutral-900 border border-white/5 text-white hover:bg-brand-accent hover:border-brand-accent disabled:opacity-30 disabled:hover:bg-neutral-900 disabled:hover:border-white/5 transition-all min-h-[48px] min-w-[48px]"
          aria-label="Next Preview Page"
        >
          <FiChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Small Scrollreel Thumbnails */}
      <div className="w-full flex gap-2 overflow-x-auto pb-1 mt-1 max-w-full justify-start md:justify-center scroll-smooth">
        {images.map((image, idx) => (
          <button
            key={image.id}
            onClick={() => setCurrentPage(idx)}
            className={`relative w-9 h-12 rounded border flex-shrink-0 bg-neutral-900 overflow-hidden transition-all duration-150 ${
              idx === activePageIndex
                ? 'border-brand-accent ring-1 ring-brand-accent scale-105'
                : 'border-white/10 opacity-60 hover:opacity-100'
            }`}
          >
            <div
              className="w-full h-full flex items-center justify-center transition-transform"
              style={{ transform: `rotate(${image.rotation}deg)` }}
            >
              <img src={image.url} alt="" className="max-w-full max-h-full object-contain" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
