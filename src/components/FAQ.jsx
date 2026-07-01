import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiHelpCircle } from 'react-icons/fi';

const faqs = [
  {
    question: 'Are my images uploaded to any server?',
    answer: 'Absolutely not. PDF PRO is designed as a private-first application. All processes—including image scaling, rotation, formatting, and PDF compilation—take place directly in your web browser. No data ever leaves your device.',
  },
  {
    question: 'What image formats are supported?',
    answer: 'We support JPG, JPEG, PNG, WEBP, and HEIC files. HEIC files (commonly used on Apple devices) are automatically converted into JPEGs locally during upload.',
  },
  {
    question: 'How do I rearrange pages?',
    answer: 'After uploading your images, each file appears as a card in the Page Organizer grid. You can click and drag the move handle icon on any card to rearrange the pages. The page numbers automatically update to match.',
  },
  {
    question: 'How does Smart Layout differ from Fit or Fill?',
    answer: 'Smart Layout automatically detects whether an image is portrait (tall) or landscape (wide) and adjusts the page orientation page-by-page. Fit scales images to fit inside the standard page borders, while Fill stretches them to cover the entire page.',
  },
  {
    question: 'Can I use this application offline?',
    answer: 'Yes! Because PDF PRO operates entirely in-browser without server dependencies, once the application is loaded in your browser, it will work completely offline. You can convert your images to PDFs in remote locations or during travel.',
  },
  {
    question: 'Are there any watermarks or hidden costs?',
    answer: 'None. PDF PRO is free, has no limits on page count, and leaves your documents completely clean and watermark-free. It has been built to offer premium SaaS functionality for free.',
  },
];

function AccordionItem({ faq, isOpen, onToggle }) {
  return (
    <div className="bg-brand-card rounded-xl border border-white/5 overflow-hidden transition-all duration-300 hover:border-brand-accent/20">
      <button
        onClick={onToggle}
        className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left cursor-pointer focus:outline-none min-h-[52px] gap-3"
        aria-expanded={isOpen}
      >
        <span className="text-sm sm:text-base md:text-lg font-bold text-white pr-2 leading-snug">
          {faq.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-brand-text-muted shrink-0"
        >
          <FiChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-4 sm:px-6 pb-5 pt-2 text-sm md:text-base text-brand-text-muted leading-relaxed border-t border-white/5">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 max-w-4xl mx-auto" id="faq">
      <div className="text-center mb-10 md:mb-16 space-y-4">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
          <span className="inline-flex items-center justify-center gap-2 flex-wrap">
            <FiHelpCircle className="text-brand-accent shrink-0" />
            Frequently Asked{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-accent to-brand-hover">
              Questions
            </span>
          </span>
        </h2>
        <p className="text-brand-text-muted text-sm md:text-lg px-2">
          Got questions? We have answers. If you have more, check the GitHub repository.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            faq={faq}
            isOpen={openIndex === index}
            onToggle={() => handleToggle(index)}
          />
        ))}
      </div>
    </section>
  );
}
