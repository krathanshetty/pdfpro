import { create } from 'zustand';
import imageCompression from 'browser-image-compression';

const normalizeImageFile = async (file) => {
  const nameLower = file.name.toLowerCase();

  if (nameLower.endsWith('.heic') || file.type === 'image/heic') {
    try {
      const heic2any = (await import('heic2any')).default;
      const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
      const newName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
      return new File([Array.isArray(blob) ? blob[0] : blob], newName, { type: 'image/jpeg' });
    } catch (error) {
      console.error('HEIC conversion failed for file:', file.name, error);
      return file;
    }
  }

  if (!file.type.startsWith('image/')) {
    return file;
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Unsupported image: ${file.name}`));
      image.src = url;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }

    const maxDim = 2000;
    const ratio = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error(`Failed to convert image: ${file.name}`));
          return;
        }
        resolve(result);
      }, 'image/jpeg', 0.9);
    });

    return new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' });
  } catch (error) {
    console.warn('Image normalization failed for file:', file.name, error);
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
};

const normalizeRotation = (value) => {
    const normalized = Math.round(value / 90) * 90;
    return ((normalized % 360) + 360) % 360;
  };

  const renderTransformedImage = async (image, transform = {}) => {
    const file = image.file;
    if (!file) return image.url;

    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error(`Unable to load image: ${image.name}`));
        element.src = url;
      });

      const crop = transform.crop ?? image.crop;
      const rotation = normalizeRotation(transform.rotation ?? image.rotation ?? 0);
    const flipX = transform.flipX ?? image.flipX ?? false;
    const flipY = transform.flipY ?? image.flipY ?? false;

    const sourceW = img.naturalWidth;
    const sourceH = img.naturalHeight;
    const cropX = crop ? Math.round((crop.x || 0) * sourceW) : 0;
    const cropY = crop ? Math.round((crop.y || 0) * sourceH) : 0;
    const cropW = crop ? Math.max(1, Math.round((crop.width || 1) * sourceW)) : sourceW;
    const cropH = crop ? Math.max(1, Math.round((crop.height || 1) * sourceH)) : sourceH;

    const rad = (rotation * Math.PI) / 180;
    const isRotated = rotation % 180 !== 0;
    const canvasWidth = isRotated ? cropH : cropW;
    const canvasHeight = isRotated ? cropW : cropH;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return image.url;
    }

    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.rotate(rad);
    ctx.drawImage(img, cropX, cropY, cropW, cropH, -canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);
    ctx.restore();

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error('Failed to render transformed image'));
          return;
        }
        resolve(result);
      }, 'image/jpeg', 0.98);
    });

    return URL.createObjectURL(blob);
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const usePDFStore = create((set, get) => ({
  images: [],
  pdfSettings: {
    name: 'PDF_PRO_Document',
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 'none',
    layout: 'fit', // fit, fill, original, smart
    quality: 'high', // original, high, medium, low
    compress: false,
    watermarkEnabled: false,
  },
  isGenerating: false,
  progress: 0,
  isSuccess: false,
  generatedPdfUrl: '',
  generatedPdfName: '',

  // Add images to state
  addImages: async (files) => {
    const newImages = [];
    
    for (const file of files) {
      let processedFile = await normalizeImageFile(file);

      if (!processedFile.type.startsWith('image/')) {
        continue;
      }

      // Check dimensions
      const url = URL.createObjectURL(processedFile);
      const dimensions = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => {
          resolve({ width: 0, height: 0 });
        };
        img.src = url;
      });

      const shouldDownscaleForStorage =
        processedFile.size > 4 * 1024 * 1024 ||
        (dimensions.width > 2500 && dimensions.height > 2500) ||
        dimensions.width > 4000 ||
        dimensions.height > 4000;

      if (shouldDownscaleForStorage) {
        try {
          const maxSizeMB = Math.min(2.2, Math.max(0.8, processedFile.size / (1024 * 1024) * 0.35));
          const compressedFile = await imageCompression(processedFile, {
            maxSizeMB,
            maxWidthOrHeight: 1800,
            useWebWorker: true,
            initialQuality: 0.8,
            fileType: 'image/jpeg',
          });

          if (compressedFile.size > 0 && compressedFile.size < processedFile.size) {
            processedFile = new File([compressedFile], processedFile.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
            });
          }
        } catch (error) {
          console.warn('Large-image downscale skipped:', error);
        }
      }

      if (dimensions.width === 0 || dimensions.height === 0) {
        console.warn('Skipping unsupported image:', processedFile.name);
        continue;
      }

      const finalUrl = URL.createObjectURL(processedFile);
      if (url !== finalUrl) {
        URL.revokeObjectURL(url);
      }

      newImages.push({
        id: crypto.randomUUID(),
        file: processedFile,
        url: finalUrl,
        name: processedFile.name,
        size: processedFile.size,
        width: dimensions.width,
        height: dimensions.height,
        rotation: 0, // 0, 90, 180, 270
      });
    }

    set((state) => ({
      images: [...state.images, ...newImages],
    }));
  },

  // Remove image and clean up Object URL to prevent memory leaks
  removeImage: (id) => {
    const target = get().images.find((img) => img.id === id);
    if (target) {
      URL.revokeObjectURL(target.url);
    }
    set((state) => ({
      images: state.images.filter((img) => img.id !== id),
    }));
  },

  applyImageTransform: async (id, transform) => {
    const current = get().images.find((img) => img.id === id);
    if (!current) return;
    let nextUrl;
    try {
      nextUrl = await renderTransformedImage(current, transform);
    } catch (err) {
      console.error('applyImageTransform: renderTransformedImage failed for', current.name, err);
      return;
    }

    const nextRotation = transform.rotation ?? current.rotation ?? 0;
    const nextFlipX = transform.flipX ?? current.flipX ?? false;
    const nextFlipY = transform.flipY ?? current.flipY ?? false;

    const oldUrl = current.url;

    // Update state with the new URL and mark the old URL as pending revoke
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id
          ? {
              ...img,
              url: nextUrl,
              _pendingRevoke: oldUrl && oldUrl !== nextUrl ? oldUrl : null,
              crop: transform.crop ?? img.crop ?? null,
              rotation: nextRotation,
              flipX: nextFlipX,
              flipY: nextFlipY,
            }
          : img
      ),
    }));
  },

  // Confirm that the browser has loaded the current URL for an image, and revoke any pending old URL.
  confirmImageLoaded: (id) => {
    const target = get().images.find((img) => img.id === id);
    if (!target) return;
    const pending = target._pendingRevoke;
    if (pending) {
      try {
        URL.revokeObjectURL(pending);
      } catch (e) {
        console.warn('Failed to revoke pending object URL', e);
      }
    }

    // Clear the pending field
    set((state) => ({
      images: state.images.map((img) => (img.id === id ? { ...img, _pendingRevoke: null } : img)),
    }));
  },

  resetImageCrop: async (id) => {
    const current = get().images.find((img) => img.id === id);
    if (!current) return;
    const nextUrl = await renderTransformedImage(current, { crop: null, rotation: 0, flipX: false, flipY: false });
    if (current.url) URL.revokeObjectURL(current.url);
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id
          ? { ...img, url: nextUrl, crop: null, rotation: 0, flipX: false, flipY: false }
          : img
      ),
    }));
  },

  replaceImage: async (id, file) => {
    const current = get().images.find((img) => img.id === id);
    if (!current) return;

    const normalizedFile = await normalizeImageFile(file);
    if (!normalizedFile.type.startsWith('image/')) return;

    const url = URL.createObjectURL(normalizedFile);
    const dimensions = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = url;
    });

    if (dimensions.width === 0 || dimensions.height === 0) {
      URL.revokeObjectURL(url);
      return;
    }

    URL.revokeObjectURL(current.url);

    set((state) => ({
      images: state.images.map((img) =>
        img.id === id
          ? {
              ...img,
              file: normalizedFile,
              url,
              name: normalizedFile.name,
              size: normalizedFile.size,
              width: dimensions.width,
              height: dimensions.height,
              crop: null,
              rotation: 0,
            }
          : img
      ),
    }));
  },

  // Rotate image by 90 degrees
  rotateImage: async (id, direction) => {
    const current = get().images.find((img) => img.id === id);
    if (!current) return;
    const currentRotation = normalizeRotation(current.rotation ?? 0);
    const offset = direction === 'right' ? 90 : -90;
    const nextRotation = normalizeRotation(currentRotation + offset);
    await get().applyImageTransform(id, { crop: current.crop, rotation: nextRotation, flipX: current.flipX, flipY: current.flipY });
  },

  // Duplicate an image page
  duplicateImage: (id) => {
    const target = get().images.find((img) => img.id === id);
    if (!target) return;
    
    // Create new URL for the duplicate to manage lifecycles separately
    const duplicateUrl = URL.createObjectURL(target.file);
    const duplicatedImage = {
      ...target,
      id: crypto.randomUUID(),
      url: duplicateUrl,
    };

    set((state) => {
      const index = state.images.findIndex((img) => img.id === id);
      const newImages = [...state.images];
      newImages.splice(index + 1, 0, duplicatedImage);
      return { images: newImages };
    });
  },

  // Reorder images
  reorderImages: (activeId, overId) => {
    set((state) => {
      const oldIndex = state.images.findIndex((img) => img.id === activeId);
      const newIndex = state.images.findIndex((img) => img.id === overId);
      if (oldIndex === -1 || newIndex === -1) return {};
      
      const newImages = [...state.images];
      const [removed] = newImages.splice(oldIndex, 1);
      newImages.splice(newIndex, 0, removed);
      return { images: newImages };
    });
  },

  // Set reordered images array directly
  setImages: (images) => {
    set({ images });
  },

  // Update PDF settings
  updateSettings: (settings) => {
    set((state) => ({
      pdfSettings: { ...state.pdfSettings, ...settings },
    }));
  },

  // Reset store
  reset: () => {
    get().images.forEach((img) => URL.revokeObjectURL(img.url));
    if (get().generatedPdfUrl) {
      URL.revokeObjectURL(get().generatedPdfUrl);
    }
    set({
      images: [],
      isGenerating: false,
      progress: 0,
      isSuccess: false,
      generatedPdfUrl: '',
      generatedPdfName: '',
    });
  },

  setGenerating: (isGenerating) => set({ isGenerating }),
  setProgress: (progress) => set({ progress }),
  setSuccessState: (isSuccess, generatedPdfUrl, generatedPdfName) => set({
    isSuccess,
    generatedPdfUrl,
    generatedPdfName,
  }),
}));
