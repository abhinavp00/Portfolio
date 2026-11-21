import React from 'react';
import { ArrowUp, Github, Linkedin, Lock, Mail } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { trackEvent } from '../lib/analytics';

interface FooterProps {
  onNotify?: (message: string) => void;
  onNavigate?: (path: string) => void;
  onOpenPrivacy?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenPrivacy }) => {
  const { portfolio } = usePortfolio();
  const { profile, contact, settings } = portfolio;

  const quickLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'skills', label: 'Skills' },
    { id: 'projects', label: 'Projects' },
    { id: 'contact', label: 'Contact' },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-[#303030] bg-[#080808] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pb-8 border-b border-[#303030]">
          {/* Brand Summary + Email */}
          <div>
            <div className="flex items-center">
              <span className="font-display text-xl font-semibold tracking-[0.12em] text-[#D8F0E7] uppercase">
                {profile.fullName}
              </span>
              <span className="font-display text-2xl text-[#B56AFF] leading-none ml-1" aria-hidden="true">
                *
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-[#BDBDBD]">
              {profile.jobTitle}.
            </p>
            <a
              href={`mailto:${contact.email}`}
              onClick={() =>
                trackEvent('email_click', {
                  source: 'footer_text',
                  section: 'footer',
                  destination: 'email',
                })
              }
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-mono text-[#D3B5FF] hover:text-[#D8F0E7] transition-colors"
            >
              <Mail className="w-3.5 h-3.5 shrink-0 text-[#B56AFF]" />
              <span>{contact.email}</span>
            </a>
          </div>

          {/* Quick Links */}
          <nav className="flex flex-wrap items-center gap-6" aria-label="Footer Quick Links">
            {quickLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(link.id);
                }}
                className="font-nav text-sm text-[#BDBDBD] hover:text-[#D3B5FF] transition-colors whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Social & Back to Top */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <a
              href={contact.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent('github_click', {
                  source: 'footer',
                  section: 'footer',
                  destination: 'github',
                })
              }
              aria-label="GitHub Profile"
              className="font-nav inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#303030] bg-[#141414] text-xs font-medium text-[#BDBDBD] hover:text-[#D8F0E7] hover:border-[#B56AFF] transition-colors"
            >
              <Github className="w-3.5 h-3.5 text-[#D3B5FF]" />
              <span>GitHub</span>
            </a>

            <a
              href={contact.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent('linkedin_click', {
                  source: 'footer',
                  section: 'footer',
                  destination: 'linkedin',
                })
              }
              aria-label="LinkedIn Profile"
              className="font-nav inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#303030] bg-[#141414] text-xs font-medium text-[#BDBDBD] hover:text-[#D8F0E7] hover:border-[#B56AFF] transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5 text-[#B56AFF]" />
              <span>LinkedIn</span>
            </a>

            <a
              href={`mailto:${contact.email}`}
              onClick={() =>
                trackEvent('email_click', {
                  source: 'footer_button',
                  section: 'footer',
                  destination: 'email',
                })
              }
              aria-label="Send Email"
              className="font-nav inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#303030] bg-[#141414] text-xs font-medium text-[#BDBDBD] hover:text-[#D8F0E7] hover:border-[#B56AFF] transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#B56AFF]" />
              <span>Send Email</span>
            </a>

            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Back to Top"
              className="font-nav inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#303030] bg-[#191919] text-xs font-medium text-[#D8F0E7] hover:border-[#B56AFF] transition-colors"
            >
              <ArrowUp className="w-3.5 h-3.5 text-[#B56AFF]" />
              <span>Back to Top</span>
            </button>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#858585]">
          <p>Designed &amp; Developed by {profile.fullName}.</p>
          <div className="flex flex-wrap items-center gap-4">
            <p>{settings.footerCopyright || '© 2026 Abhinav P. All Rights Reserved.'}</p>
            {onOpenPrivacy && (
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="text-[#858585] hover:text-[#BDBDBD] transition-colors underline underline-offset-4"
              >
                Privacy
              </button>
            )}
            <a
              href="/admin/login"
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('/admin/login');
                }
              }}
              className="inline-flex items-center gap-1 text-[#858585] hover:text-[#D3B5FF] transition-colors"
            >
              <Lock className="w-3 h-3" />
              <span>Admin Panel</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
