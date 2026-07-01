import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiGithub } from 'react-icons/fi';

const NAVBAR_HEIGHT = 72; // px — used to offset anchor scroll

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef(null);

  // ── Scroll-state listener ──────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Close drawer when clicking outside ────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen]);

  // ── Lock body scroll when drawer is open ─────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const navLinks = [
    { name: 'Home',     href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'FAQ',      href: '#faq' },
  ];

  // ── Scroll helper – compensates for fixed navbar height ───────────────────
  const scrollToSection = (href) => {
    setIsOpen(false);
    // Small delay lets the drawer close before scrolling so layout is stable
    requestAnimationFrame(() => {
      const el = document.querySelector(href);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT - 8;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  };

  // ── Animation variants for the full-width mobile drawer ───────────────────
  const drawerVariants = {
    hidden: { opacity: 0, y: -8, scaleY: 0.96, transformOrigin: 'top' },
    visible: {
      opacity: 1, y: 0, scaleY: 1,
      transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
      opacity: 0, y: -8, scaleY: 0.96,
      transition: { duration: 0.2, ease: 'easeIn' },
    },
  };

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled || isOpen
          ? 'bg-[rgba(9,9,9,0.82)] backdrop-blur-[18px] border-b border-white/[0.07] shadow-lg shadow-black/40'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 md:px-12 h-[72px] flex items-center justify-between">

        {/* Logo */}
        <a
          href="#home"
          onClick={(e) => { e.preventDefault(); scrollToSection('#home'); }}
          className="flex items-center gap-2 group"
        >
          <span className="text-xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-brand-accent group-hover:to-brand-hover transition duration-300">
            PDF PRO
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => { e.preventDefault(); scrollToSection(link.href); }}
              className="text-sm font-medium text-brand-text-muted hover:text-white transition-colors duration-200"
            >
              {link.name}
            </a>
          ))}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-text-muted hover:text-white transition-colors duration-200"
            aria-label="GitHub Repository"
          >
            <FiGithub className="w-5 h-5" />
          </a>

        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="p-2.5 text-white hover:text-brand-accent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={isOpen ? 'Close Menu' : 'Open Menu'}
            aria-expanded={isOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0,   opacity: 1 }}
                  exit={{   rotate:  90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <FiX className="w-6 h-6" />
                </motion.span>
              ) : (
                <motion.span
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0,  opacity: 1 }}
                  exit={{   rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <FiMenu className="w-6 h-6" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* ── Full-width mobile drawer ──────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-drawer"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="md:hidden w-full bg-[rgba(9,9,9,0.95)] backdrop-blur-2xl border-t border-white/[0.07]"
          >
            <div className="px-5 pt-3 pb-8 flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); scrollToSection(link.href); }}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.22 }}
                  className="flex items-center text-lg font-semibold text-brand-text-muted hover:text-white active:text-brand-accent transition-colors duration-150 py-4 border-b border-white/[0.06] min-h-[56px]"
                >
                  {link.name}
                </motion.a>
              ))}

              {/* GitHub row */}
              <motion.a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinks.length * 0.06, duration: 0.22 }}
                className="flex items-center gap-3 text-lg font-semibold text-brand-text-muted hover:text-white transition-colors duration-150 py-4 min-h-[56px] mt-1"
                onClick={() => setIsOpen(false)}
              >
                <FiGithub className="w-5 h-5 shrink-0" />
                GitHub
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
