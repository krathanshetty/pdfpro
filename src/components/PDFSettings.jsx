import { usePDFStore } from '../store/usePDFStore';
import { FiFile, FiLayout, FiMaximize, FiSettings, FiSliders, FiFileText } from 'react-icons/fi';

export default function PDFSettings() {
  const pdfSettings = usePDFStore((state) => state.pdfSettings);
  const updateSettings = usePDFStore((state) => state.updateSettings);

  const handleNameChange = (e) => {
    // Sanitizes file name by removing characters that are illegal in file names
    const sanitized = e.target.value.replace(/[/\\?%*:|"<>]/g, '');
    updateSettings({ name: sanitized });
  };

  const handleSettingChange = (key, value) => {
    updateSettings({ [key]: value });
  };

  // Determine which controls are disabled based on Layout selection
  const isOriginalLayout = pdfSettings.layout === 'original';
  const isSmartLayout = pdfSettings.layout === 'smart';

  return (
    <div className="w-full bg-brand-card rounded-brand border border-white/5 p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2 pb-4 border-b border-white/5">
        <FiSettings className="w-5 h-5 text-brand-accent animate-pulse" />
        <h3 className="text-lg font-bold text-white">PDF Configuration</h3>
      </div>

      {/* PDF Filename */}
      <div className="space-y-2">
        <label htmlFor="pdf-name" className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted flex items-center gap-1.5">
          <FiFileText className="text-brand-accent" /> PDF Filename
        </label>
        <div className="relative">
          <input
            id="pdf-name"
            type="text"
            value={pdfSettings.name}
            onChange={handleNameChange}
            placeholder="Semester Notes"
            className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-accent transition-colors pr-12 font-medium"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-text-muted">
            .pdf
          </span>
        </div>
      </div>

      {/* Page Size */}
      <div className="space-y-2">
        <label htmlFor="page-size" className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted flex items-center gap-1.5">
          <FiMaximize className="text-brand-accent" /> Page Size
        </label>
        <select
          id="page-size"
          value={pdfSettings.pageSize}
          onChange={(e) => handleSettingChange('pageSize', e.target.value)}
          disabled={isOriginalLayout}
          className={`w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-accent transition-colors font-medium outline-none cursor-pointer ${
            isOriginalLayout ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        >
          <option value="a4">A4 (595 × 841 pt)</option>
          <option value="letter">Letter (612 × 792 pt)</option>
          <option value="legal">Legal (612 × 1008 pt)</option>
          <option value="a5">A5 (419 × 595 pt)</option>
        </select>
        {isOriginalLayout && (
          <p className="text-[10px] text-brand-accent/80 font-medium">
            Overridden by "One Image Per Page" layout.
          </p>
        )}
      </div>

      {/* Orientation */}
      <div className="space-y-2">
        <label htmlFor="orientation" className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted flex items-center gap-1.5">
          <FiLayout className="text-brand-accent" /> Page Orientation
        </label>
        <select
          id="orientation"
          value={pdfSettings.orientation}
          onChange={(e) => handleSettingChange('orientation', e.target.value)}
          disabled={isOriginalLayout || isSmartLayout}
          className={`w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-accent transition-colors font-medium outline-none cursor-pointer ${
            isOriginalLayout || isSmartLayout ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
        {isOriginalLayout && (
          <p className="text-[10px] text-brand-accent/80 font-medium">
            Overridden by "One Image Per Page" layout.
          </p>
        )}
        {!isOriginalLayout && isSmartLayout && (
          <p className="text-[10px] text-brand-accent/80 font-medium">
            Overridden by dynamic "Smart Layout".
          </p>
        )}
      </div>

      {/* Margins */}
      <div className="space-y-2">
        <label htmlFor="margin" className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted flex items-center gap-1.5">
          <FiSliders className="text-brand-accent" /> Margins
        </label>
        <select
          id="margin"
          value={pdfSettings.margin}
          onChange={(e) => handleSettingChange('margin', e.target.value)}
          className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-accent transition-colors font-medium outline-none cursor-pointer"
        >
          <option value="none">None (0pt)</option>
          <option value="small">Small (18pt / 0.25 in)</option>
          <option value="medium">Medium (36pt / 0.50 in)</option>
          <option value="large">Large (54pt / 0.75 in)</option>
        </select>
      </div>

      {/* Layout Presets */}
      <div className="space-y-2">
        <label htmlFor="layout" className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted flex items-center gap-1.5">
          <FiLayout className="text-brand-accent" /> Layout Preset
        </label>
        <select
          id="layout"
          value={pdfSettings.layout}
          onChange={(e) => handleSettingChange('layout', e.target.value)}
          className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-accent transition-colors font-medium outline-none cursor-pointer"
        >
          <option value="fit">Fit (Keep Aspect Ratio)</option>
          <option value="fill">Fill (Crop Page Overflow)</option>
          <option value="original">One Image Per Page (Original Size)</option>
          <option value="smart">Smart Layout (Auto-Orient)</option>
        </select>
      </div>

      {/* Quality Settings */}
      <div className="space-y-2">
        <label htmlFor="quality" className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted flex items-center gap-1.5">
          <FiFile className="text-brand-accent" /> Image Rendering Quality
        </label>
        <select
          id="quality"
          value={pdfSettings.quality}
          onChange={(e) => handleSettingChange('quality', e.target.value)}
          disabled={pdfSettings.compress}
          className={`w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-accent transition-colors font-medium outline-none cursor-pointer ${
            pdfSettings.compress ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        >
          <option value="original">Original Size</option>
          <option value="high">High Definition (2000px Max)</option>
          <option value="medium">Standard (1200px Max)</option>
          <option value="low">Compact (800px Max)</option>
        </select>
      </div>

      {/* Compression Toggle */}
      <div className="flex items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-white/5">
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className="text-sm font-semibold text-white">Compress PDF Size</span>
          <span className="text-[11px] text-brand-text-muted leading-snug">Optimizes dimensions &amp; decreases file size.</span>
        </div>
        <button
          onClick={() => handleSettingChange('compress', !pdfSettings.compress)}
          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
            pdfSettings.compress ? 'bg-brand-accent' : 'bg-neutral-800'
          }`}
          role="switch"
          aria-checked={pdfSettings.compress}
          aria-label="Toggle PDF Compression"
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              pdfSettings.compress ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
