import { FiGithub, FiHeart, FiFileText } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function Footer() {
  const handleLinkClick = (name) => {
    toast.success(`${name} policy is enforced locally. Your privacy is fully protected.`, {
      style: {
        background: '#161616',
        color: '#fff',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      },
      iconTheme: {
        primary: '#E11D48',
        secondary: '#fff',
      },
    });
  };

  return (
    <footer className="w-full bg-brand-bg border-t border-white/5 py-12 px-6 md:px-12 mt-20 relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-accent/5 rounded-full filter blur-[100px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side: Logo & Copyright */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-brand-accent">
              PDF PRO
            </span>
          </div>
          <p className="text-xs text-brand-text-muted text-center md:text-left mt-1">
            © {new Date().getFullYear()} PDF PRO. Built locally for absolute privacy.
          </p>
        </div>

        {/* Middle: Made with love */}
        <div className="text-xs text-brand-text-muted flex items-center gap-1.5 select-none order-last md:order-none">
          Crafted with <FiHeart className="text-brand-accent fill-brand-accent animate-pulse" /> for high quality exports.
        </div>

        {/* Right Side: Links */}
        <div className="flex items-center gap-6 text-sm text-brand-text-muted">
          {/* Shared link style: inline-flex so icon + text baseline aligns perfectly */}
          <button
            onClick={() => handleLinkClick('Privacy')}
            className="inline-flex items-center leading-none p-0 bg-transparent border-0 hover:text-white transition-colors cursor-pointer"
          >
            Privacy
          </button>
          <button
            onClick={() => handleLinkClick('Terms')}
            className="inline-flex items-center leading-none p-0 bg-transparent border-0 hover:text-white transition-colors cursor-pointer"
          >
            Terms
          </button>
          <a
            href="https://www.linkedin.com/in/shettykrathan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center leading-none hover:text-white transition-colors cursor-pointer"
            aria-label="LinkedIn Profile"
          >
            Contact
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 leading-none hover:text-white transition-colors"
            aria-label="GitHub Repository Link"
          >
            <FiGithub className="w-4 h-4" /> GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
