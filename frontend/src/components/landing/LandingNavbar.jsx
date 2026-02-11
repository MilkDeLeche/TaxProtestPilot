import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { MotionButton } from '../MotionButton';

const LIGHT_PAGES = ['/documentation', '/terms', '/privacy', '/support'];

export const LandingNavbar = () => {
  const { pathname } = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDocumentationPage = pathname === '/documentation';
  // Docs page: deep blue at top, switches to light on scroll (like landing page behavior).
  // Other "light pages": always light.
  const useLightNav = (LIGHT_PAGES.includes(pathname) && !isDocumentationPage) || isScrolled;
  const useBlueNavAtTop = isDocumentationPage && !isScrolled;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        useLightNav
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm'
          : useBlueNavAtTop
            ? 'bg-[#0f172a]/90 backdrop-blur-xl border-b border-white/10'
            : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src={useLightNav ? '/images/TAXPILOT2.png' : '/images/TAXPILOT2%20dark.png'}
              alt="Tax Protest Pilot"
              className="h-[176px] w-[106px] object-contain object-left"
            />
          </Link>

          {/* Desktop Nav Links (same on landing and documentation; hash links go to landing when not on home) */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const href = pathname === '/' ? link.href : `/${link.href}`;
              return (
                <a
                  key={link.label}
                  href={href}
                  className={`text-sm font-medium transition-colors hover:opacity-80 ${
                    useLightNav ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
                className={`text-sm font-medium transition-colors ${
                  useLightNav ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'
                }`}
            >
              Sign In
            </Link>
            <Link to="/login">
              <MotionButton data-testid="navbar-get-started-btn" size="sm">
                Get Started Free
              </MotionButton>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              useLightNav ? 'text-slate-900 hover:bg-slate-100' : 'text-white hover:bg-white/10'
            }`}
          >
            {isMobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200"
        >
          <div className="px-6 py-6 space-y-4">
            {navLinks.map((link) => {
              const href = pathname === '/' ? link.href : `/${link.href}`;
              return (
                <a
                  key={link.label}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-slate-600 font-medium hover:text-slate-900 py-2"
                >
                  {link.label}
                </a>
              );
            })}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <Link to="/login" className="block text-slate-600 font-medium hover:text-slate-900 py-2">
                Sign In
              </Link>
              <Link to="/login" className="block">
                <MotionButton className="w-full" data-testid="mobile-get-started-btn">
                  Get Started Free
                </MotionButton>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};
