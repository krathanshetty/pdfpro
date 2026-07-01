import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiImage, FiCamera, FiPlus, FiClipboard, FiLoader } from 'react-icons/fi';
import { usePDFStore } from '../store/usePDFStore';
import { useClipboard } from '../hooks/useClipboard';
import { toast } from 'react-hot-toast';

export default function UploadArea() {
  const addImages = usePDFStore((state) => state.addImages);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressVal, setProgressVal] = useState(0);

  // File processing wrapper that manages progress
  const processFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    // Filter valid files
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
    
    const filteredFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      return validTypes.includes(file.type) || validExtensions.includes(extension);
    });

    if (filteredFiles.length === 0) {
      toast.error('Supported formats: JPG, PNG, WEBP, HEIC.', {
        style: { background: '#161616', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.05)' }
      });
      return;
    }

    setIsProcessing(true);
    setProgressVal(10);
    
    try {
      // We chunk the addImages operation or let it run with progress steps
      // Simulating a progress bar for smooth feedback
      const step = Math.floor(90 / filteredFiles.length);
      for (let i = 0; i < filteredFiles.length; i++) {
        await addImages([filteredFiles[i]]);
        setProgressVal((prev) => Math.min(prev + step, 95));
      }
      
      setProgressVal(100);
      toast.success(`Successfully loaded ${filteredFiles.length} image(s).`, {
        style: { background: '#161616', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.05)' }
      });
    } catch (err) {
      console.error(err);
      toast.error('An error occurred during file processing.');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProgressVal(0);
      }, 500);
    }
  }, [addImages]);

  // Dropzone setup
  const onDrop = useCallback((acceptedFiles) => {
    processFiles(acceptedFiles);
  }, [processFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/heic': ['.heic']
    },
    multiple: true
  });

  // Camera upload trigger for mobile
  const handleCameraUpload = useCallback((event) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
  }, [processFiles]);

  // Paste hook integration
  useClipboard(processFiles);

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Upload Zone Card */}
      <div
        {...getRootProps()}
        className={`relative group flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed rounded-brand p-8 md:p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-brand-accent bg-brand-accent/5 shadow-[0_0_30px_rgba(225,29,72,0.15)] scale-[1.01]'
            : 'border-white/10 bg-brand-card hover:border-brand-accent/40 hover:bg-neutral-900/60'
        }`}
      >
        <input {...getInputProps()} />

        {isProcessing ? (
          // Processing State
          <div className="flex flex-col items-center gap-4">
            <FiLoader className="w-12 h-12 text-brand-accent animate-spin" />
            <h3 className="text-xl font-bold text-white">Importing & Formatting Images...</h3>
            <p className="text-brand-text-muted text-sm max-w-xs">
              Optimizing size and checking resolutions.
            </p>
            <div className="w-64 bg-white/5 rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="bg-brand-accent h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressVal}%` }}
              ></div>
            </div>
            <span className="text-xs text-brand-accent font-semibold">{progressVal}%</span>
          </div>
        ) : (
          // Normal State
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl group-hover:scale-110 group-hover:border-brand-accent/30 text-brand-text-muted group-hover:text-brand-accent transition-all duration-300">
              <FiUploadCloud className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg md:text-xl font-bold text-white">
                Drag & drop your images here
              </h3>
              <p className="text-brand-text-muted text-sm">
                or <span className="text-brand-accent font-semibold group-hover:underline">browse files</span> from your computer
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs text-brand-text-muted">
              <span className="px-2.5 py-1 bg-white/5 rounded-full border border-white/5 flex items-center gap-1.5">
                <FiImage className="text-brand-accent" /> JPG, PNG, WEBP, HEIC
              </span>
              <span className="px-2.5 py-1 bg-white/5 rounded-full border border-white/5 flex items-center gap-1.5">
                <FiClipboard className="text-brand-accent" /> Paste from Clipboard (Ctrl+V)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Camera Upload Button */}
      {!isProcessing && (
        <div className="flex justify-center gap-4 mt-6">
          <label
            htmlFor="camera-upload"
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-card hover:bg-neutral-800 border border-white/10 hover:border-white/20 rounded-xl text-white font-medium text-sm cursor-pointer shadow-lg transition-all duration-200"
          >
            <FiCamera className="w-5 h-5 text-brand-accent" />
            Capture with Camera
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraUpload}
              className="hidden"
              id="camera-upload"
            />
          </label>
        </div>
      )}
    </div>
  );
}
