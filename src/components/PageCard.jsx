import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiMaximize2, FiMove } from 'react-icons/fi';
import { Scissors, Trash2 } from 'lucide-react';
import { usePDFStore } from '../store/usePDFStore';
import { formatFileSize } from '../utils/imageUtils';

/**
 * PageCard
 * Props:
 *   image   – image record from the store
 *   index   – 0-based page number
 *   onZoom  – opens the lightbox
 *   compact – true on mobile/tablet: smaller padding, tighter buttons
 */
export default function PageCard({ image, index, onZoom, compact = false, onCrop }) {
  const removeImage = usePDFStore((s) => s.removeImage);
  const rotateImage = usePDFStore((s) => s.rotateImage);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 180ms ease, opacity 180ms ease',
    opacity: isDragging ? 0.25 : 1,
    zIndex: isDragging ? 10 : 1,
    willChange: 'transform, opacity',
  };

  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };

  const deleteBtnClass = compact
    ? 'inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-brand-text-muted transition-all duration-200 hover:bg-rose-950/45 hover:text-rose-500 focus:outline-none focus:ring-2 focus:ring-brand-accent/20'
    : 'inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-brand-text-muted transition-all duration-200 hover:bg-rose-950/45 hover:text-rose-500 focus:outline-none focus:ring-2 focus:ring-brand-accent/20';

  return (
    <motion.div
      ref={setNodeRef}
      layout
      style={style}
      className={`group relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#161616] transition-all duration-200 touch-pan-y hover:-translate-y-0.5 hover:border-brand-accent/30 hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)] ${
        isDragging ? 'shadow-2xl ring-2 ring-brand-accent' : ''
      }`}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {/* ── Card Header (Page Number + Drag Handle) on Compact ── */}
      {compact && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 select-none bg-transparent">
          <span className="text-xs font-semibold text-white/95 leading-none">Page {index + 1}</span>
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-white/10 bg-[#111111] text-brand-text-muted transition-colors duration-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent/20 touch-none drag-grab active:drag-grabbing"
            title="Drag to rearrange"
            aria-label="Drag handle to rearrange page"
          >
            <FiMove className="w-4 h-4" />
          </button>
        </div>
      )}

      {!compact && (
        <div
          className="absolute left-2.5 top-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#090909] text-xs font-bold text-white shadow-md"
        >
          {index + 1}
        </div>
      )}

      {!compact && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute right-2.5 top-2.5 z-20 inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-white/10 bg-[#111111] text-brand-text-muted transition-colors duration-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent/20 touch-none drag-grab active:drag-grabbing"
          title="Drag to rearrange"
          aria-label="Drag handle to rearrange page"
        >
          <FiMove className="w-4 h-4" />
        </button>
      )}

      {/* ── Thumbnail ─────────────────────────────────────────────────────── */}
      <div
        className={`relative flex items-center justify-center overflow-hidden touch-pan-y bg-[#121212] ${
          compact ? 'aspect-square p-2.5' : 'aspect-[4/5] p-2'
        }`}
      >
        {/* gradient overlay — desktop only to preserve mobile thumbnail brightness */}
        {!compact && (
          <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-black/60 to-transparent" />
        )}

        <div
          className="flex h-full w-full items-center justify-center transition-transform duration-300"
          style={{ transform: `rotate(${image.rotation}deg)` }}
        >
          <img
            src={image.url}
            alt={image.name}
            className="max-h-full max-w-full select-none rounded object-contain shadow-sm"
            loading="lazy"
            draggable={false}
          />
        </div>

        {/* Zoom overlay — hidden on compact (tap opens lightbox via card press instead) */}
        {!compact && (
          <button
            onClick={stop(() => onZoom(image))}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            title="Zoom image"
            aria-label="Zoom image"
          >
            <div className="p-3 rounded-full bg-brand-accent text-white shadow-lg hover:scale-110 active:scale-95 transition-all">
              <FiMaximize2 className="w-5 h-5" />
            </div>
          </button>
        )}

        {/* On compact, tap thumbnail to zoom */}
        {compact && (
          <button
            onClick={stop(() => onZoom(image))}
            className="absolute inset-0 z-10"
            aria-label="Zoom image"
          />
        )}
      </div>

      {/* ── Metadata + actions ────────────────────────────────────────────── */}
      <div className={compact ? 'bg-[#161616] p-2' : 'flex flex-1 flex-col justify-between p-3'}>

        {/* File name + dimensions — hidden on compact to save space */}
        {!compact && (
          <div className="mb-2.5">
            <h4 className="max-w-full truncate text-[13px] font-semibold text-white" title={image.name}>
              {image.name}
            </h4>
            <p className="mt-0.5 text-[11px] leading-4 text-brand-text-muted">
              {image.width} × {image.height}px • {formatFileSize(image.size)}
            </p>
          </div>
        )}

        <div className="mt-3 flex w-full items-center justify-center">
          <button
            onClick={stop(() => removeImage(image.id))}
            className={deleteBtnClass}
            title="Delete"
            aria-label="Delete page"
          >
            <Trash2 className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
