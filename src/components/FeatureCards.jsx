import { motion } from 'framer-motion';
import { 
  FiZap, 
  FiShield, 
  FiLayers, 
  FiGrid, 
  FiEdit3, 
  FiWifiOff, 
  FiStar, 
  FiHeart 
} from 'react-icons/fi';

export default function FeatureCards() {
  const features = [
    {
      icon: <FiZap className="w-6 h-6 text-amber-400" />,
      title: 'Lightning Fast',
      desc: 'Process files, compile pages, and build high-quality PDFs instantly in your browser.',
    },
    {
      icon: <FiShield className="w-6 h-6 text-emerald-400" />,
      title: 'Private & Secure',
      desc: 'Your files never touch any server. Everything occurs locally for complete privacy.',
    },
    {
      icon: <FiLayers className="w-6 h-6 text-rose-400" />,
      title: 'Unlimited Images',
      desc: 'Import as many JPG, PNG, WEBP, or HEIC files as you need with no limits.',
    },
    {
      icon: <FiGrid className="w-6 h-6 text-indigo-400" />,
      title: 'Smart Layouts',
      desc: 'Fit, crop, match orientation automatically, or custom resize to create neat presentations.',
    },
    {
      icon: <FiEdit3 className="w-6 h-6 text-cyan-400" />,
      title: 'Rename PDFs',
      desc: 'Customize file names to organize your lecture notes, resumes, or scans instantly.',
    },
    {
      icon: <FiWifiOff className="w-6 h-6 text-amber-400" />,
      title: 'Works Offline',
      desc: 'No internet connection needed. Generate PDFs on planes, trains, or anywhere.',
    },
    {
      icon: <FiStar className="w-6 h-6 text-purple-400" />,
      title: 'No Watermarks',
      desc: 'We never insert watermark stamps. Your generated documents are completely clean.',
    },
    {
      icon: <FiHeart className="w-6 h-6 text-rose-500" />,
      title: 'Free Forever',
      desc: 'Get full functionality including drag & drop reordering and quality controls for free.',
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto" id="features">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
          Engineered for <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-accent to-brand-hover">Speed & Security</span>
        </h2>
        <p className="text-brand-text-muted text-base md:text-lg max-w-2xl mx-auto">
          A premium suite of tools running inside your browser. No subscription required.
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {features.map((feat, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative bg-brand-card rounded-brand border border-white/5 p-6 hover:border-brand-accent/30 transition-all duration-300 shadow-xl overflow-hidden flex flex-col justify-between"
          >
            {/* Glowing background card element */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full filter blur-xl group-hover:bg-brand-accent/15 transition-colors duration-300"></div>

            <div className="space-y-4 z-10">
              <div className="inline-flex p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-brand-accent/30 transition-colors">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-brand-accent transition-colors">
                {feat.title}
              </h3>
              <p className="text-sm text-brand-text-muted leading-relaxed">
                {feat.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
