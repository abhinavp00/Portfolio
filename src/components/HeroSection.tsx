import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Download, Github, Linkedin, Mail, Send, User } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { trackEvent } from '../lib/analytics';
import { HeroTechBackground } from './HeroTechBackground';
import { HeroTypingHeadline } from './HeroTypingHeadline';
import {
  DjangoBadgeIcon,
  EditorialStar,
  PostgresBadgeIcon,
  PowerBIBadgeIcon,
  PythonBadgeIcon,
  ReactBadgeIcon,
  SqlBadgeIcon,
} from './TechIcons';

export const HeroSection: React.FC<{ ready?: boolean }> = ({ ready = true }) => {
  const shouldReduceMotion = useReducedMotion();
  const { portfolio, getResumeDownloadUrl } = usePortfolio();
  const { profile, contact, activeResume } = portfolio;
  const [imgError, setImgError] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const techBadges = [
    { name: 'Python', Icon: PythonBadgeIcon },
    { name: 'Django', Icon: DjangoBadgeIcon },
    { name: 'React', Icon: ReactBadgeIcon },
    { name: 'PostgreSQL', Icon: PostgresBadgeIcon },
    { name: 'Power BI', Icon: PowerBIBadgeIcon },
    { name: 'SQL', Icon: SqlBadgeIcon },
  ];

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative overflow-hidden bg-[#080808] pt-10 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28"
    >
      {/* Subtle Editorial Grid & Soft Purple Ambient Lighting */}
      <div className="pointer-events-none absolute inset-0 bg-editorial-grid opacity-70" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-32 left-1/4 h-[28rem] w-[28rem] rounded-full bg-[#873BFF]/10 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-20 right-[8%] h-[24rem] w-[24rem] rounded-full bg-[#B56AFF]/14 blur-[120px]"
        aria-hidden="true"
      />

      {/* Floating Technology Ecosystem Background */}
      <HeroTechBackground sectionRef={sectionRef} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Editorial Typography & Actions */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col justify-center"
          >
            <div className="flex items-center gap-2.5 text-xs tracking-[0.18em] text-[#D3B5FF] uppercase font-nav">
              <EditorialStar className="w-3.5 h-3.5 text-[#B56AFF] shrink-0" />
              <span>{profile.availabilityLabel}</span>
            </div>

            <HeroTypingHeadline
              greeting={profile.greeting}
              heading={profile.heroHeading || profile.fullName}
              ready={ready}
            />

            <p className="mt-5 font-nav text-lg sm:text-xl font-medium text-[#E9E9E9]">
              {profile.jobTitle}
            </p>

            {/* Editorial Tagline */}
            <div className="mt-3 flex flex-wrap items-center gap-2.5 font-editorial text-lg sm:text-xl italic text-[#D3B5FF]">
              <span>Build</span>
              <span className="text-[#B56AFF] text-sm" aria-hidden="true">•</span>
              <span>Analyze</span>
              <span className="text-[#B56AFF] text-sm" aria-hidden="true">•</span>
              <span>Innovate</span>
            </div>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#BDBDBD]">
              {profile.heroDescription}
            </p>

            {/* Highlight Keywords */}
            <div
              className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm"
              aria-label="Core engineering focus keywords"
            >
              {profile.heroHighlights.map((keyword, index) => (
                <React.Fragment key={keyword}>
                  <span className="animate-gradient-text font-nav font-medium">
                    {keyword}
                  </span>
                  {index < profile.heroHighlights.length - 1 && (
                    <span className="text-[#858585]" aria-hidden="true">
                      ·
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Pill-Shaped CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              {activeResume && (
                <a
                  href={getResumeDownloadUrl('hero')}
                  download={activeResume.fileName}
                  onClick={() =>
                    trackEvent('resume_download_attempt', {
                      source: 'hero',
                      section: 'hero',
                      destination: 'resume_pdf',
                      metadata: { versionNumber: activeResume.versionNumber, fileName: activeResume.fileName },
                    })
                  }
                  className="font-nav inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#873BFF] to-[#B56AFF] hover:brightness-110 text-sm font-medium text-[#F8FAFC] whitespace-nowrap shrink-0 shadow-[0_0_28px_rgba(135,59,255,0.35)] transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D3B5FF]"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Download Resume</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => scrollToSection('projects')}
                className="group font-nav inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#303030] bg-[#141414] hover:bg-[#191919] hover:border-[#B56AFF] text-sm font-medium text-[#D8F0E7] whitespace-nowrap shrink-0 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B56AFF]"
              >
                <span>Explore My Projects</span>
                <ArrowRight className="w-4 h-4 shrink-0 text-[#B56AFF] transition-transform duration-150 group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('contact')}
                className="font-nav inline-flex items-center gap-2 px-5 py-3 rounded-full border border-[#303030] bg-transparent hover:bg-[#141414] hover:border-[#B56AFF]/70 text-sm font-medium text-[#BDBDBD] hover:text-[#D8F0E7] whitespace-nowrap shrink-0 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B56AFF]"
              >
                <Send className="w-4 h-4 shrink-0 text-[#D3B5FF]" />
                <span>Let&apos;s Connect</span>
              </button>
            </div>

            {/* Direct Contact & Social Links */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <a
                href={contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent('linkedin_click', { source: 'hero', section: 'hero', destination: 'linkedin' })
                }
                aria-label="Connect on LinkedIn"
                className="font-nav inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#303030] bg-[#101010] text-xs font-medium text-[#BDBDBD] hover:text-[#D8F0E7] hover:border-[#B56AFF] hover:shadow-[0_0_16px_rgba(135,59,255,0.22)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B56AFF]"
              >
                <Linkedin className="w-3.5 h-3.5 text-[#B56AFF]" />
                <span>Connect on LinkedIn</span>
              </a>

              <a
                href={contact.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent('github_click', { source: 'hero', section: 'hero', destination: 'github' })
                }
                aria-label="GitHub Profile"
                className="font-nav inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#303030] bg-[#101010] text-xs font-medium text-[#BDBDBD] hover:text-[#D8F0E7] hover:border-[#B56AFF] hover:shadow-[0_0_16px_rgba(135,59,255,0.22)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B56AFF]"
              >
                <Github className="w-3.5 h-3.5 text-[#D3B5FF]" />
                <span>GitHub</span>
              </a>

              <a
                href={`mailto:${contact.email}`}
                onClick={() =>
                  trackEvent('email_click', { source: 'hero', section: 'hero', destination: 'email' })
                }
                aria-label={`Send Email to ${profile.fullName}`}
                className="font-nav inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#303030] bg-[#101010] text-xs font-medium text-[#BDBDBD] hover:text-[#D8F0E7] hover:border-[#B56AFF] hover:shadow-[0_0_16px_rgba(135,59,255,0.22)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B56AFF]"
              >
                <Mail className="w-3.5 h-3.5 text-[#B56AFF]" />
                <span>Send Email</span>
              </a>
            </div>

            {/* Key Credentials & Core Tech Showcase */}
            <div className="mt-8 pt-6 border-t border-[#303030]/80 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#858585]">
                  Core Disciplines · BCA (2022–2025)
                </p>
                <p className="mt-1.5 text-xs sm:text-sm font-medium text-[#E9E9E9]">
                  {profile.focusAreas.join(' · ')}
                </p>
              </div>

              <div className="min-w-0 w-full tech-marquee-viewport py-1">
                <div className="tech-marquee-track">
                  <div className="tech-marquee-group">
                    {techBadges.map(({ name, Icon }) => (
                      <div
                        key={`primary-${name}`}
                        title={name}
                        className="group flex flex-col items-center justify-center gap-1 w-[68px] sm:w-[74px] shrink-0 py-2 px-1.5 rounded-xl bg-[#141414] border border-[#303030] hover:border-[#B56AFF]/70 hover:shadow-[0_0_18px_rgba(135,59,255,0.2)] transition-all duration-150 hover:-translate-y-0.5"
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="font-mono text-[9px] text-[#858585] group-hover:text-[#D8F0E7] truncate max-w-full">
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="tech-marquee-group tech-marquee-duplicate" aria-hidden="true">
                    {techBadges.map(({ name, Icon }) => (
                      <div
                        key={`duplicate-${name}`}
                        title={name}
                        className="group flex flex-col items-center justify-center gap-1 w-[68px] sm:w-[74px] shrink-0 py-2 px-1.5 rounded-xl bg-[#141414] border border-[#303030] hover:border-[#B56AFF]/70 hover:shadow-[0_0_18px_rgba(135,59,255,0.2)] transition-all duration-150 hover:-translate-y-0.5"
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="font-mono text-[9px] text-[#858585] group-hover:text-[#D8F0E7] truncate max-w-full">
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Enlarged Orbital Portrait Stage */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex flex-col items-center gap-6"
          >
            <div className="relative flex items-center justify-center w-[310px] h-[310px] sm:w-[410px] sm:h-[410px] lg:w-[450px] lg:h-[450px] xl:w-[480px] xl:h-[480px] max-w-full">
              {/* Layer 1: Soft Purple Ambient Glow Aura */}
              <div
                className="pointer-events-none absolute inset-4 sm:inset-6 rounded-full bg-[radial-gradient(circle_at_center,rgba(135,59,255,0.34)_0%,rgba(181,106,255,0.16)_46%,transparent_74%)] blur-3xl animate-ambient-glow"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-12 sm:inset-16 rounded-full bg-gradient-to-tr from-[#873BFF]/25 via-[#B56AFF]/15 to-transparent blur-2xl animate-ambient-glow"
                aria-hidden="true"
              />

              {/* Layer 2A: Outer Orbital Ring */}
              <div
                className="pointer-events-none absolute inset-0 rounded-full border border-[#B56AFF]/35 shadow-[0_0_32px_rgba(135,59,255,0.22),inset_0_0_24px_rgba(181,106,255,0.08)] animate-orbital-slow"
                aria-hidden="true"
              >
                <div className="absolute inset-0 rounded-full orbital-light-arc" />
                <EditorialStar className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 text-[#D3B5FF] drop-shadow-[0_0_10px_rgba(181,106,255,0.9)]" />
                <span className="absolute bottom-5 right-8 sm:bottom-8 sm:right-12 w-2.5 h-2.5 rounded-full bg-[#B56AFF] shadow-[0_0_12px_#B56AFF]" />
                <span className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rounded-full bg-[#D3B5FF]/85 shadow-[0_0_10px_#D3B5FF]" />
              </div>

              {/* Layer 2B: Middle Dashed Orbital Ring */}
              <div
                className="pointer-events-none absolute inset-5 sm:inset-6 rounded-full border border-dashed border-[#D3B5FF]/25 animate-orbital-reverse"
                aria-hidden="true"
              >
                <span className="absolute top-7 left-5 sm:top-9 sm:left-7 w-1.5 h-1.5 rounded-full bg-[#D8F0E7]/80 shadow-[0_0_8px_rgba(216,240,231,0.75)]" />
                <EditorialStar className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 text-[#B56AFF]/85" />
              </div>

              {/* Layer 2C: Inner Precision Hairline Ring */}
              <div
                className="pointer-events-none absolute inset-11 sm:inset-14 rounded-full border border-[#B56AFF]/15"
                aria-hidden="true"
              />

              {/* Layer 3: Authentic Enlarged Portrait Container */}
              <div className="relative z-10 w-[224px] sm:w-[296px] lg:w-[330px] xl:w-[356px] aspect-[5/4] rounded-2xl overflow-hidden border border-[#B56AFF]/50 bg-[#101010] shadow-[0_0_55px_rgba(135,59,255,0.28)] animate-portrait-float">
                {!imgError ? (
                  <img
                    src={profile.profileImageUrl}
                    alt={`${profile.fullName} — ${profile.jobTitle}`}
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#141414] text-[#BDBDBD]">
                    <User className="w-12 h-12 mb-2 text-[#B56AFF]" />
                    <span className="font-display text-sm font-semibold text-[#D8F0E7]">
                      {profile.fullName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
