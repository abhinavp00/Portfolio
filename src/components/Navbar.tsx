import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Github, Linkedin, Menu, X } from 'lucide-react';
import { NAV_ITEMS } from '../data/portfolioData';
import { usePortfolio } from '../context/PortfolioContext';
import { trackEvent } from '../lib/analytics';

interface NavbarProps {
  activeSection: string;
  onNotify?: (message: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeSection }) => {
  const { portfolio, getResumeDownloadUrl } = usePortfolio();
  const { profile, contact, activeResume } = portfolio;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 border-b border-[#303030] ${
        scrolled
          ? 'bg-[#080808]/92 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.45)]'
          : 'bg-[#080808]/75 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8 h-16">
        {/* Editorial Serif Logo */}
        <a
          href="#home"
          onClick={(e) => handleNavClick(e, 'home')}
          className="flex items-center whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B56AFF] rounded-md px-1"
          aria-label={`${profile.fullName} Portfolio Home`}
        >
          <span className="font-display text-xl sm:text-2xl font-semibold tracking-[0.14em] text-[#D8F0E7] uppercase">
            {profile.fullName}
          </span>
        </a>

        {/* Centered Navigation */}
        <nav className="hidden lg:flex items-center justify-center gap-5 xl:gap-6" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`font-nav relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B56AFF] rounded ${
                  isActive ? 'text-[#D8F0E7]' : 'text-[#BDBDBD] hover:text-[#D3B5FF]'
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-active-underline"
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-x-0 -bottom-0.5 h-[1.5px] rounded-full bg-gradient-to-r from-[#873BFF] via-[#B56AFF] to-[#D3B5FF]"
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <a
            href={contact.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent('linkedin_click', { source: 'navbar', section: 'navbar', destination: 'linkedin' })
            }
            aria-label="LinkedIn Profile"
            title="LinkedIn Profile"
            className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#303030] bg-[#141414] text-[#BDBDBD] hover:text-[#D8F0E7] hover:border-[#B56AFF] hover:shadow-[0_0_16px_rgba(135,59,255,0.3)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B56AFF]"
          >
            <Linkedin className="w-4 h-4" />
          </a>

          <a
            href={contact.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent('github_click', { source: 'navbar', section: 'navbar', destination: 'github' })
            }
            aria-label="GitHub Profile"
            title="GitHub Profile"
            className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#303030] bg-[#141414] text-[#BDBDBD] hover:text-[#D8F0E7] hover:border-[#B56AFF] hover:shadow-[0_0_16px_rgba(135,59,255,0.3)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B56AFF]"
          >
            <Github className="w-4 h-4" />
          </a>

          {activeResume && (
            <a
              href={getResumeDownloadUrl('navbar')}
              download={activeResume.fileName}
              onClick={() =>
                trackEvent('resume_download_attempt', {
                  source: 'navbar',
                  section: 'navbar',
                  destination: 'resume_pdf',
                  metadata: { versionNumber: activeResume.versionNumber, fileName: activeResume.fileName },
                })
              }
              className="font-nav inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#873BFF] to-[#B56AFF] hover:brightness-110 text-xs sm:text-sm font-medium text-[#F8FAFC] whitespace-nowrap shrink-0 shadow-[0_0_20px_rgba(135,59,255,0.3)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D3B5FF]"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Download Resume</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#303030] bg-[#141414] text-[#D8F0E7] hover:border-[#B56AFF] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B56AFF]"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden border-b border-[#303030] bg-[#101010]/98 backdrop-blur-lg"
          >
            <nav className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1" aria-label="Mobile Navigation">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => handleNavClick(e, item.id)}
                    className={`font-nav px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#191919] text-[#D8F0E7] border border-[#303030]'
                        : 'text-[#BDBDBD] hover:text-[#D8F0E7] hover:bg-[#141414]'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}

              <div className="mt-3 pt-3 border-t border-[#303030] flex items-center gap-4 px-3">
                <a
                  href={contact.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent('github_click', { source: 'mobile_navbar', section: 'navbar', destination: 'github' })
                  }
                  className="inline-flex items-center gap-2 text-xs font-medium text-[#BDBDBD] hover:text-[#D8F0E7]"
                >
                  <Github className="w-4 h-4 text-[#B56AFF]" />
                  <span>GitHub</span>
                </a>
                <span className="text-[#858585]" aria-hidden="true">·</span>
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent('linkedin_click', { source: 'mobile_navbar', section: 'navbar', destination: 'linkedin' })
                  }
                  className="inline-flex items-center gap-2 text-xs font-medium text-[#BDBDBD] hover:text-[#D8F0E7]"
                >
                  <Linkedin className="w-4 h-4 text-[#B56AFF]" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
