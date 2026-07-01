import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { 
  FiFileText, 
  FiDownload, 
  FiRefreshCw, 
  FiLoader, 
  FiCheckCircle, 
  FiSliders, 
  FiTrash2 
} from 'react-icons/fi';

// Store & Utils
import { usePDFStore } from './store/usePDFStore';
import { generatePDF } from './utils/pdfGenerator';
import { formatFileSize } from './utils/imageUtils';

// Components
import AmbientBackground from './components/AmbientBackground';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import UploadArea from './components/UploadArea';
import PageOrganizer from './components/PageOrganizer';
import PDFSettings from './components/PDFSettings';
import PreviewPanel from './components/PreviewPanel';
import FeatureCards from './components/FeatureCards';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

export default function App() {
  const images = usePDFStore((state) => state.images);
  const pdfSettings = usePDFStore((state) => state.pdfSettings);
  const isGenerating = usePDFStore((state) => state.isGenerating);
  const progress = usePDFStore((state) => state.progress);
  const isSuccess = usePDFStore((state) => state.isSuccess);
  const generatedPdfUrl = usePDFStore((state) => state.generatedPdfUrl);
  const generatedPdfName = usePDFStore((state) => state.generatedPdfName);
  const setGenerating = usePDFStore((state) => state.setGenerating);
  const setProgress = usePDFStore((state) => state.setProgress);
  const setSuccessState = usePDFStore((state) => state.setSuccessState);
  const reset = usePDFStore((state) => state.reset);

  const [generatedPdfSize, setGeneratedPdfSize] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Preparing images…');

  if (typeof window !== 'undefined') {
    window.usePDFStore = usePDFStore;
  }

  const handleGenerate = async () => {
    if (images.length === 0) {
      toast.error('Please upload some images first.');
      return;
    }

    setGenerating(true);
    setProgress(5);
    setProgressLabel('Preparing images…');

    try {
      const pdfBlob = await generatePDF(
        images,
        pdfSettings,
        // onProgress — now receives (value, label)
        (value, label) => {
          setProgress(value);
          if (label) setProgressLabel(label);
        },
        // onWarning — friendly non-blocking toast
        (message) => {
          toast(message, {
            icon: '⚡',
            style: { background: '#161616', color: '#fff', border: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' },
            duration: 5000,
          });
        },
      );

      setGeneratedPdfSize(pdfBlob.size);
      const url      = URL.createObjectURL(pdfBlob);
      const filename = `${pdfSettings.name || 'PDF_PRO_Document'}.pdf`;
      setSuccessState(true, url, filename);
      setGenerating(false);

      toast.success('PDF compiled successfully!', {
        style: { background: '#161616', color: '#fff', border: '1px solid rgba(255,255,255,0.05)' },
      });
    } catch (err) {
      console.error(err);
      const msg = err?.message?.toLowerCase() ?? '';
      if (msg.includes('memory') || msg.includes('quota')) {
        toast.error('Device memory is low. Try fewer images or lower quality setting.');
      } else if (msg.includes('failed to load')) {
        toast.error('Unable to process one or more images. Please try again.');
      } else {
        toast.error('Something went wrong generating your PDF. Please try again.');
      }
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedPdfUrl) return;
    const link = document.createElement('a');
    link.href = generatedPdfUrl;
    link.download = generatedPdfName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateAnother = () => {
    // Keep images but dismiss success modal to let them modify or add to pages
    setSuccessState(false, '', '');
  };

  return (
    <div className="min-h-screen text-white relative">
      <Toaster position="bottom-right" />
      <AmbientBackground />
      <Navbar />

      {/* Hero Header: Only visible when no files are loaded */}
      {images.length === 0 && <Hero />}

      {/* Main Core App Workspace Workspace */}
      <main className="pt-24 pb-8 md:pt-28 relative z-10" id="workspace">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* If empty: Center Upload Box */}
          {images.length === 0 ? (
            <div className="py-6">
              <UploadArea />
            </div>
          ) : (
            // Active Workspace Grid
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8 px-3 sm:px-4 items-start">
              
              {/* Left Column: Drag & Drop Grid + Quick Add Upload */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Drag-Drop Grid Catalog */}
                <PageOrganizer />

                {/* Additional upload files dropzone */}
                <div className="border-t border-white/5 pt-8">
                  <div className="max-w-xl mx-auto">
                    <h4 className="text-center text-sm font-semibold text-brand-text-muted mb-4 uppercase tracking-wider">
                      Add more images
                    </h4>
                    <UploadArea />
                  </div>
                </div>
              </div>

              {/* Right Column: PDF Configurations & Live Preview (Sticky) */}
              <div className="lg:col-span-4 space-y-4 sm:space-y-6 lg:sticky lg:top-24">
                
                {/* Config Controls */}
                <PDFSettings />

                {/* Live visual CSS layout preview */}
                <PreviewPanel />

                {/* Generate PDF Button block */}
                <div className="space-y-3 pt-1">
                  <motion.button
                    onClick={handleGenerate}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative group w-full py-4 bg-gradient-to-r from-brand-accent to-brand-hover text-white text-base font-bold rounded-xl shadow-lg shadow-brand-accent/20 hover:shadow-brand-accent/40 cursor-pointer overflow-hidden transition-all duration-300 min-h-[52px]"
                  >
                    <div className="absolute inset-0 w-full h-full bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                    <span className="flex items-center justify-center gap-2">
                      <FiFileText className="w-5 h-5" />
                      Generate PDF ({images.length} Page{images.length !== 1 ? 's' : ''})
                    </span>
                  </motion.button>

                  <button
                    onClick={reset}
                    className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 border border-white/5 hover:border-white/10 text-brand-text-muted hover:text-rose-500 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer min-h-[48px]"
                  >
                    <FiTrash2 /> Reset Workspace
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Marketing Sections: Only visible when no files are loaded */}
          {images.length === 0 && (
            <>
              <FeatureCards />
              <FAQ />
            </>
          )}

        </div>
      </main>

      <Footer />

      {/* Generation Overlay Loader */}
      <AnimatePresence>
        {isGenerating && !isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-4"
          >
            <div className="bg-brand-card border border-white/5 rounded-brand p-8 max-w-sm w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full filter blur-xl"></div>
              
              <FiLoader className="w-12 h-12 text-brand-accent animate-spin mx-auto" />
              
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Generating PDF…</h3>
                <p className="text-brand-text-muted text-xs transition-all duration-300">
                  {progressLabel}
                </p>
              </div>

              {/* Progress Slider representation */}
              <div className="space-y-2">
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-brand-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-brand-accent">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal Screen Overlay */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-brand-card border border-white/10 rounded-brand p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden"
            >
              {/* Checkmark Animation container */}
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                >
                  <FiCheckCircle className="w-12 h-12" />
                </motion.div>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-white">PDF Created Successfully</h3>
                <p className="text-brand-text-muted text-sm truncate max-w-xs mx-auto mt-1" title={generatedPdfName}>
                  {generatedPdfName}
                </p>
                <p className="text-xs text-emerald-400 font-semibold bg-emerald-500/5 border border-emerald-500/10 rounded-full py-1 px-3 inline-block mt-2">
                  File Size: {formatFileSize(generatedPdfSize)}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                {/* Download PDF Button */}
                <motion.button
                  onClick={handleDownload}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer overflow-hidden transition-all duration-200 min-h-[48px]"
                >
                  <FiDownload className="w-5 h-5" /> Download PDF
                </motion.button>

                {/* Back to Organizer editor */}
                <button
                  onClick={handleCreateAnother}
                  className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 border border-white/5 hover:border-white/10 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer min-h-[48px]"
                >
                  <FiRefreshCw /> Keep Editing / Add More Pages
                </button>

                {/* Reset Slate Workspace */}
                <button
                  onClick={() => {
                    reset();
                    toast.success('Workspace reset.');
                  }}
                  className="w-full py-3 text-brand-text-muted hover:text-rose-500 text-xs font-semibold flex items-center justify-center gap-1.5 hover:underline transition-colors cursor-pointer"
                >
                  Start Over (Clear Workspace)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
