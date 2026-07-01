import { motion } from 'framer-motion';
import { FiArrowRight, FiUpload, FiSliders, FiDownload, FiLayers } from 'react-icons/fi';

export default function Hero() {
  const handleScrollToWorkspace = () => {
    const workspace = document.querySelector('#workspace');
    if (workspace) {
      workspace.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const steps = [
    { icon: <FiUpload />, label: 'Upload' },
    { icon: <FiLayers />, label: 'Arrange Pages' },
    { icon: <FiSliders />, label: 'Rename PDF' },
    { icon: <FiDownload />, label: 'Download Instantly' },
  ];

  return (
    <section
      className="relative overflow-hidden flex items-center justify-center min-h-[100svh] pt-[88px] pb-16 md:pt-32 md:pb-24 px-6 text-center"
      id="home"
    >
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-accent/15 rounded-full glow-particle pointer-events-none -z-10 blur-[120px]"></div>

      <div className="max-w-4xl mx-auto flex flex-col items-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-wider text-brand-accent uppercase mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-ping"></span>
          100% Client-Side & Private
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1] md:leading-[1.15]"
        >
          Create Beautiful PDFs <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-accent via-[#FF4D6D] to-brand-hover">
            From Images In Seconds
          </span>
        </motion.h1>

        {/* Subtitle / Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-brand-text-muted text-sm sm:text-base font-medium mb-10 max-w-2xl"
        >
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-brand-accent bg-brand-accent/10 p-1.5 rounded-md border border-brand-accent/10">
                {step.icon}
              </span>
              <span className="text-white/80">{step.label}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <button
            onClick={handleScrollToWorkspace}
            className="group relative inline-flex items-center justify-center gap-2 appearance-none bg-gradient-to-r from-brand-accent to-brand-hover text-white text-base font-semibold px-8 py-4 rounded-xl shadow-lg shadow-brand-accent/20 hover:shadow-brand-accent/40 cursor-pointer overflow-hidden transition-all duration-300"
          >
            <div className="absolute inset-0 w-full h-full bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
            <span className="relative z-10">Start Creating</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
