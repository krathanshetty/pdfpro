import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  AutoScrollActivator,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX, FiInfo } from 'react-icons/fi';
import { RefreshCcw, ZoomIn, ZoomOut } from 'lucide-react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { usePDFStore } from '../store/usePDFStore';
import PageCard from './PageCard';

/** Returns true when viewport width is below the md breakpoint (768px). */
function useIsCompact() {
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setCompact(e.matches);
    mq.addEventListener('change', handler);
    setCompact(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return compact;
}

export default function PageOrganizer() {
  const images        = usePDFStore((s) => s.images);
  const reorderImages = usePDFStore((s) => s.reorderImages);
  const pdfSettings   = usePDFStore((s) => s.pdfSettings);
  const updateSettings= usePDFStore((s) => s.updateSettings);

  const [activeId, setActiveId] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const [cropImage, setCropImage] = useState(null);
  const [cropMode, setCropMode] = useState('free');
  // `cropRect` kept as normalized fractions (0-1) used by the store
  const [cropRect, setCropRect] = useState({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
  // `reactCrop` is the percent-based crop state used by react-image-crop
  const [reactCrop, setReactCrop] = useState({ unit: '%', x: 10, y: 10, width: 80, height: 80 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState(null);
  const [overrideSrc, setOverrideSrc] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const applyImageTransform = usePDFStore((s) => s.applyImageTransform);

  const isCompact = useIsCompact();

  // ── DnD sensors ────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // mouse: require 8 px movement
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay:     220, // long-press needed to start drag on mobile
        tolerance: 5,   // small finger wobble allowed before drag begins
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart  = (e) => setActiveId(e.active.id);
  const handleDragEnd    = ({ active, over }) => {
    if (over && active.id !== over.id) reorderImages(active.id, over.id);
    setActiveId(null);
  };
  const handleDragCancel = () => setActiveId(null);

  const activeImage = images.find((img) => img.id === activeId);

  const getInitialCropRect = (image) => {
    if (image?.crop) {
      return {
        x: image.crop.x,
        y: image.crop.y,
        width: image.crop.width,
        height: image.crop.height,
      };
    }

    return { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
  };

  const handleCropSelect = (_image) => {
    // Crop feature disabled — no-op
    return;
  };

  const handleCloseCrop = () => {
    setCropImage(null);
    setCropMode('free');
    setCropRect({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
    setZoomLevel(1);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
  };

  const cropPresets = [
    { value: 'free', label: 'Free' },
    { value: '1:1', label: '1:1' },
    { value: '4:3', label: '4:3' },
    { value: '16:9', label: '16:9' },
    { value: 'a4', label: 'A4' },
    { value: 'letter', label: 'Letter' },
  ];

  const aspectMap = {
    free: undefined,
    '1:1': 1,
    '4:3': 4 / 3,
    '16:9': 16 / 9,
    a4: 210 / 297,
    letter: 8.5 / 11,
  };

  const applyPreset = (preset) => {
    setCropMode(preset);
    // when switching presets, update reactCrop to center a crop with the chosen aspect
    const aspect = aspectMap[preset];
    if (!aspect) return;
    // center a crop with 80% size in the viewport using the aspect
    const containerWidth = 100;
    const containerHeight = 100;
    let width = 80;
    let height = 80;
    // adjust to maintain aspect
    if (aspect > 1) {
      // wider than tall
      height = Math.round((width / aspect));
    } else {
      width = Math.round((height * aspect));
    }
    const x = Math.round((containerWidth - width) / 2);
    const y = Math.round((containerHeight - height) / 2);
    setReactCrop({ unit: '%', x, y, width, height });
    setCropRect({ x: x / 100, y: y / 100, width: width / 100, height: height / 100 });
  };

  // Handler when react-image-crop changes. Keep both percent state and normalized state in sync.
  const handleReactCropChange = (newCrop) => {
    setReactCrop(newCrop);
    // Convert percent-based crop to normalized fractions for the store
    if (newCrop && typeof newCrop.x === 'number') {
      setCropRect({ x: (newCrop.x || 0) / 100, y: (newCrop.y || 0) / 100, width: (newCrop.width || 0) / 100, height: (newCrop.height || 0) / 100 });
    }
  };

  const handleSaveCrop = async () => {
    if (!cropImage) return;
    await applyImageTransform(cropImage.id, {
      crop: cropRect,
      rotation,
      flipX,
      flipY,
    });
    handleCloseCrop();
  };

  const rotateImage = (dir) => setRotation((prev) => (prev + (dir === 'left' ? -90 : 90) + 360) % 360);

  useEffect(() => {
    const onWheel = (e) => {
      if (!cropImage) return;
      e.preventDefault();
      setZoomLevel((prev) => Math.min(2.5, Math.max(0.8, prev + (e.deltaY < 0 ? 0.1 : -0.1))));
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [cropImage]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!cropImage) return;
      if (e.key === 'Escape') handleCloseCrop();
      if (e.key === 'Enter') handleSaveCrop();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cropImage, cropRect, rotation, flipX, flipY]);

  useEffect(() => {
    if (!cropImage) {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [cropImage]);

  // Render the ReactCrop area as a separate function to avoid JSX parsing issues in ternaries
  const renderCropArea = () => {
    return (
      <div className="react-crop-wrapper w-full h-full">
        <style>{`.react-image-crop-custom, .react-image-crop-custom * { pointer-events: auto !important; } .react-image-crop-custom [class*="drag"], .react-image-crop-custom [class*="Drag"], .react-image-crop-custom [class*="handle"] { cursor: move !important; pointer-events: auto !important; } .react-image-crop-custom img { user-select: none; -webkit-user-drag: none; }`}</style>
        <ReactCrop
          className="react-image-crop-custom"
          src={overrideSrc ?? cropImage.url}
          crop={reactCrop}
          ruleOfThirds
          keepSelection
          onChange={handleReactCropChange}
          onComplete={() => { /* noop - we update state onChange already */ }}
          onImageLoaded={(img) => {
            try { setImageNaturalSize({ w: img.naturalWidth, h: img.naturalHeight }); } catch (e) {}
            return false;
          }}
          crossOrigin="anonymous"
          imageStyle={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
          style={{ maxHeight: '100%', maxWidth: '100%', background: '#111111', zIndex: 20 }}
        />
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 mt-6 md:mt-10">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="sticky top-20 z-30 mb-4 rounded-2xl border border-white/10 bg-[#111111]/95 px-3 py-3 backdrop-blur md:static md:mb-6 md:border-0 md:bg-transparent md:px-0 md:py-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4 md:border-b md:border-white/5 md:pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-white">
            <h2 className="text-xl md:text-2xl font-bold">Page Organizer</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-brand-accent/20 border border-brand-accent/30 text-brand-accent rounded-full">
              {images.length} Page{images.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs md:text-sm text-brand-text-muted flex items-center gap-1.5">
            <FiInfo className="text-brand-accent shrink-0" />
            <span className="hidden sm:inline">Drag pages to rearrange. Actions apply instantly.</span>
            <span className="sm:hidden">Long-press a card to drag and reorder.</span>
          </p>
        </div>

        {/* Watermark toggle */}
        <div className="flex items-center justify-between gap-3 self-stretch rounded-2xl border border-white/10 bg-brand-card/90 px-3 py-2.5 shadow-md md:min-w-[220px] md:self-auto md:px-4">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">Watermark</span>
            <span className="text-xs font-semibold text-white">Add PDF Pro badge</span>
          </div>
          <button
            onClick={() => updateSettings({ watermarkEnabled: !pdfSettings.watermarkEnabled })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-transparent shadow-inner transition-all duration-200 ease-in-out ${
              pdfSettings.watermarkEnabled ? 'bg-brand-accent shadow-[0_0_0_3px_rgba(225,29,72,0.16)]' : 'bg-neutral-800'
            }`}
            role="switch"
            aria-checked={pdfSettings.watermarkEnabled}
            aria-label="Include PDF Pro Watermark Toggle"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                pdfSettings.watermarkEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>
      </div>

      {/* ── DnD Context & Sortable Grid ─────────────────────────────────── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={[restrictToWindowEdges]}
        autoScroll={{
          activator: AutoScrollActivator.Pointer,
          threshold: { x: 0.15, y: 0.15 },
          acceleration: 12,
        }}
      >
        <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
          {/*
            Grid breakpoints:
              mobile  (<640px)  → 2 cols, tight gap
              sm      (640–767) → 2 cols
              md      (768–)    → 3 cols  (desktop unchanged from before)
              lg      (1024–)   → 4 cols
          */}
          <div className="dnd-grid grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 md:gap-4 lg:gap-5">
            {images.map((image, index) => (
              <PageCard
                key={image.id}
                image={image}
                index={index}
                onZoom={setZoomImage}
                compact={isCompact}
                onCrop={handleCropSelect}
              />
            ))}
          </div>
        </SortableContext>

        {/* ── Drag overlay (lifted ghost card) ──────────────────────────── */}
        <DragOverlay adjustScale={false}>
          {activeId && activeImage ? (
            <motion.div
              initial={{ scale: 1,    rotate: 0   }}
              animate={{ scale: 1.04, rotate: 1.5 }}
              className="w-full opacity-95 shadow-2xl ring-2 ring-brand-accent rounded-xl overflow-hidden bg-brand-card flex flex-col border border-white/10 select-none pointer-events-none"
            >
              <div className={`relative bg-neutral-900 overflow-hidden flex items-center justify-center ${isCompact ? 'aspect-[3/4] p-2' : 'aspect-[3/4] p-4'}`}>
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ transform: `rotate(${activeImage.rotation}deg)` }}
                >
                  <img
                    src={activeImage.url}
                    alt={activeImage.name}
                    className="max-w-full max-h-full object-contain rounded"
                  />
                </div>
              </div>
              {!isCompact && (
                <div className="p-3 bg-brand-card">
                  <h4 className="text-sm font-semibold text-white truncate">{activeImage.name}</h4>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    {activeImage.width} × {activeImage.height}px
                  </p>
                </div>
              )}
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Crop Editor ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {cropImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-black/90 px-2 py-3 pt-20 sm:px-4 sm:py-4 md:pt-24"
          >
            <motion.div
              initial={{ scale: 0.96, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              className="flex max-h-[calc(100dvh-6rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#121212] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-3 sm:px-4">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-white">Crop {cropImage.name}</h3>
                  <p className="text-xs text-brand-text-muted">Drag the frame, adjust zoom, and save the selected area</p>
                </div>
                <button onClick={handleCloseCrop} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white" title="Close crop editor" aria-label="Close crop editor">
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:p-4 lg:flex-row">
                <div className="min-h-[280px] flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-2 sm:min-h-[360px]">
                  <div className="relative h-full min-h-[260px] w-full overflow-hidden rounded-xl bg-neutral-900">
                    {/* Hidden loader image to detect load errors */}
                    <img
                      src={overrideSrc ?? cropImage.url}
                      alt=""
                      crossOrigin="anonymous"
                      onLoad={(e) => {
                        setImageLoaded(true);
                        setImageLoadError(false);
                        setImageNaturalSize({ w: e.target.naturalWidth, h: e.target.naturalHeight });
                        // notify store that the new image URL has been loaded so it's safe to revoke pending old URL
                        try {
                          const confirm = usePDFStore.getState().confirmImageLoaded;
                          if (typeof confirm === 'function') confirm(cropImage.id);
                        } catch (err) {
                          // ignore
                        }
                      }}
                      onError={() => setImageLoadError(true)}
                      className="hidden"
                    />

                    <div className="w-full h-full flex items-center justify-center relative">
                      {/* Visible debug fallback image to confirm browser can render the blob URL */}
                      {imageLoaded && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                          <img src={overrideSrc ?? cropImage.url} alt="preview" className="max-w-full max-h-full object-contain pointer-events-none" />
                        </div>
                      )}
                      {imageLoadError ? (
                        <div className="flex h-full w-full flex-col items-center justify-center text-center text-sm text-rose-400">
                          <div>Failed to load image for cropping.</div>
                          <div className="mt-2 flex gap-2">
                            <button
                              className="rounded px-3 py-1 text-xs bg-white/10"
                              onClick={() => {
                                // try a fresh object URL from the original file
                                if (cropImage?.file) {
                                  try {
                                    if (overrideSrc) URL.revokeObjectURL(overrideSrc);
                                  } catch (e) {}
                                  const tmp = URL.createObjectURL(cropImage.file);
                                  setOverrideSrc(tmp);
                                  setImageLoadError(false);
                                  setImageLoaded(false);
                                }
                              }}
                            >
                              Retry with file
                            </button>
                          </div>
                        </div>
                      ) : !imageLoaded ? (
                        <div className="flex h-full w-full items-center justify-center text-sm text-brand-text-muted">Loading image…</div>
                      ) : (
                        renderCropArea()
                      )}
                    </div>
                    {/* Debug panel (temporary) */}
                    <div className="pointer-events-none absolute left-4 top-4 z-50 hidden rounded bg-black/60 px-3 py-2 text-xs text-white sm:block">
                      <div className="truncate max-w-[34rem]">src: {overrideSrc ? 'override' : cropImage.url ? 'store' : 'none'}</div>
                      <div>loaded: {String(imageLoaded)}</div>
                      <div>error: {String(imageLoadError)}</div>
                      <div>natural: {imageNaturalSize ? `${imageNaturalSize.w}×${imageNaturalSize.h}` : '—'}</div>
                      <div>file: {cropImage.file ? `${cropImage.file.type} ${Math.round(cropImage.file.size/1024)}KB` : '—'}</div>
                    </div>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-3 lg:w-[280px] lg:min-w-[280px]">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="mb-2 flex flex-wrap gap-2">
                      {cropPresets.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => applyPreset(preset.value)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${cropMode === preset.value ? 'bg-brand-accent text-white' : 'bg-white/10 text-brand-text-muted'}`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setZoomLevel((prev) => Math.max(1, prev - 0.1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-white" title="Zoom out" aria-label="Zoom out">
                        <ZoomOut className="h-4 w-4" />
                      </button>
                      <button onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-white" title="Zoom in" aria-label="Zoom in">
                        <ZoomIn className="h-4 w-4" />
                      </button>
                      <button onClick={() => setZoomLevel(1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-white" title="Reset zoom" aria-label="Reset zoom">
                        <RefreshCcw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-2">
                    <button onClick={handleCloseCrop} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-white">Cancel</button>
                    <button onClick={handleSaveCrop} className="flex-1 rounded-xl bg-brand-accent px-3 py-3 text-sm font-semibold text-white">Save</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lightbox ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
            onClick={() => setZoomImage(null)}
          >
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all z-50 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close Lightbox"
            >
              <FiX className="w-5 h-5" />
            </button>

            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-4xl max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="transition-transform duration-300 max-w-full max-h-[72vh] flex items-center justify-center"
                style={{ transform: `rotate(${zoomImage.rotation}deg)` }}
              >
                <img
                  src={zoomImage.url}
                  alt={zoomImage.name}
                  className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-2xl border border-white/5"
                />
              </div>

              <div className="mt-3 text-center text-white bg-brand-card/80 border border-white/10 backdrop-blur-md px-4 md:px-6 py-2.5 md:py-3 rounded-xl max-w-xs md:max-w-md">
                <p className="text-sm md:text-base font-semibold truncate">{zoomImage.name}</p>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  {zoomImage.width} × {zoomImage.height}px • Rotation: {zoomImage.rotation}°
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
