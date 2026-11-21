import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import leadPredictionImg from '../assets/images/project_lead_prediction_1794744195057.jpg';
import assetSphereImg from '../assets/images/project_assetsphere_dashboard_1794744195482.jpg';
import rentACarImg from '../assets/images/project_rentacar_platform_1794744195601.jpg';
import {
  ABOUT_DATA,
  CERTIFICATIONS_DATA,
  CONTACT_CONFIG,
  EDUCATION_DATA,
  EXPERIENCE_DATA,
  HERO_DATA,
  PROJECTS_DATA,
  SERVICES_DATA,
  SKILL_CATEGORIES,
} from '../data/portfolioData';
import {
  configureAnalyticsPolicy,
  getAnonymousVisitorId,
  getSessionId,
  isTrackingPermitted,
} from '../lib/analytics';
import type { PublicPortfolioBundle } from '../types/portfolio';

const DEFAULT_BUNDLE: PublicPortfolioBundle = {
  profile: {
    id: 1,
    fullName: HERO_DATA.name,
    jobTitle: HERO_DATA.title,
    secondaryJobTitle: 'Backend Engineering | AI & Agentic Development',
    profileImageUrl: HERO_DATA.portraitUrl,
    location: CONTACT_CONFIG.location,
    availabilityLabel: HERO_DATA.availabilityLabel,
    availabilityStatus: 'available',
    greeting: HERO_DATA.greeting,
    heroHeading: HERO_DATA.name,
    heroDescription: HERO_DATA.description,
    heroHighlights: HERO_DATA.highlights,
    focusAreas: HERO_DATA.focusAreas,
    aboutSectionLabel: ABOUT_DATA.sectionLabel,
    aboutHeading: ABOUT_DATA.heading,
    aboutDescription: ABOUT_DATA.paragraphs[0] || '',
    aboutParagraphs: ABOUT_DATA.paragraphs,
    professionalSummary: '',
    careerObjective: '',
    professionalHighlights: ABOUT_DATA.highlights,
    personalInfo: ABOUT_DATA.personalInfo,
    isPublished: true,
  },
  experiences: EXPERIENCE_DATA.map((exp, idx) => ({
    id: idx + 1,
    slug: exp.id,
    indexLabel: exp.index,
    companyName: exp.company,
    jobTitle: exp.position,
    location: '',
    employmentType: 'Internship',
    startDate: '',
    endDate: '',
    periodLabel: exp.period || '',
    isCurrent: false,
    responsibilities: exp.responsibilities,
    achievements: [],
    technologies: [],
    companyLogoUrl: '',
    displayOrder: idx + 1,
    isPublished: true,
  })),
  projects: PROJECTS_DATA.map((p, idx) => ({
    id: idx + 1,
    slug: p.id,
    numberLabel: p.number,
    title: p.title,
    fullTitle: p.fullTitle,
    category: p.category,
    completed: p.completed || '',
    description: p.description,
    stack: p.stack,
    githubUrl: p.githubUrl || '',
    liveDemoUrl: '',
    imageUrl: p.imageUrl,
    imageAlt: p.imageAlt,
    screenshots: [],
    contributions: p.contributions,
    achievements: [],
    previewType: p.previewType,
    isFeatured: true,
    isPublished: true,
    displayOrder: idx + 1,
  })),
  skillCategories: SKILL_CATEGORIES.map((cat, idx) => ({
    id: idx + 1,
    slug: cat.id,
    title: cat.title,
    description: cat.description,
    iconKey: cat.id,
    displayOrder: idx + 1,
    isPublished: true,
    skills: cat.skills.map((name, sIdx) => ({
      id: idx * 100 + sIdx + 1,
      categoryId: idx + 1,
      name,
      iconUrl: '',
      proficiency: '',
      isEnabled: true,
      displayOrder: sIdx + 1,
    })),
  })),
  services: SERVICES_DATA.map((srv, idx) => ({
    id: idx + 1,
    numberLabel: srv.number,
    title: srv.title,
    description: srv.description,
    iconName: srv.iconName,
    technologies: srv.technologies,
    displayOrder: idx + 1,
    isPublished: true,
  })),
  education: EDUCATION_DATA.map((edu, idx) => ({
    id: idx + 1,
    qualification: edu.degree,
    institution: edu.institution,
    university: edu.university || '',
    performance: edu.performance,
    startDate: '',
    completionDate: '',
    periodLabel: edu.period,
    displayOrder: idx + 1,
    isPublished: true,
  })),
  certifications: CERTIFICATIONS_DATA.map((cert, idx) => ({
    id: idx + 1,
    indexLabel: cert.index,
    title: cert.title,
    issuer: cert.issuer,
    issueDate: '',
    credentialId: '',
    verificationUrl: '',
    certificatePdfAssetId: null,
    certificatePdfName: '',
    certificateImageAssetId: null,
    certificateImageUrl: '',
    displayOrder: idx + 1,
    isPublished: true,
  })),
  contact: {
    id: 1,
    email: CONTACT_CONFIG.email,
    phone: CONTACT_CONFIG.phone,
    whatsappNumber: '',
    whatsappEnabled: false,
    linkedinUrl: CONTACT_CONFIG.linkedinUrl,
    githubUrl: CONTACT_CONFIG.githubUrl,
    location: CONTACT_CONFIG.location,
    contactHeading: "Let's Build Something Meaningful Together.",
    contactDescription:
      "Have a project idea, an exciting opportunity, or want to collaborate on something innovative? I'm always interested in connecting with people working on technology, data, and intelligent digital solutions.",
    isPublished: true,
  },
  settings: {
    id: 1,
    siteTitle: 'Abhinav P | Data Analytics & Python Full Stack Developer',
    footerCopyright: '© 2026 Abhinav P. All Rights Reserved.',
    enableAnalytics: true,
    requireCookieConsent: true,
    dataRetentionDays: 180,
    whatsappEnabled: false,
    maintenanceMode: false,
    sectionOrder: [
      'hero',
      'about',
      'skills',
      'services',
      'experience',
      'projects',
      'education',
      'certifications',
      'contact',
    ],
  },
  activeResume: null,
};

export function resolveProjectImage(imageUrl: string): string {
  if (!imageUrl) return '';
  if (imageUrl === 'asset:lead_prediction') return leadPredictionImg;
  if (imageUrl === 'asset:assetsphere') return assetSphereImg;
  if (imageUrl === 'asset:rentacar') return rentACarImg;
  return imageUrl;
}

interface PortfolioContextValue {
  portfolio: PublicPortfolioBundle;
  isHydrated: boolean;
  refreshPortfolio: () => Promise<void>;
  getResumeDownloadUrl: (source: string) => string;
}

const PortfolioContext = createContext<PortfolioContextValue>({
  portfolio: DEFAULT_BUNDLE,
  isHydrated: false,
  refreshPortfolio: async () => {},
  getResumeDownloadUrl: () => '/api/resume/download',
});

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [portfolio, setPortfolio] = useState<PublicPortfolioBundle>(DEFAULT_BUNDLE);
  const [isHydrated, setIsHydrated] = useState(false);

  const refreshPortfolio = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolio/public', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setPortfolio((prev) => ({
        profile: data.profile || prev.profile,
        experiences: Array.isArray(data.experiences) ? data.experiences : prev.experiences,
        projects: Array.isArray(data.projects) ? data.projects : prev.projects,
        skillCategories: Array.isArray(data.skillCategories)
          ? data.skillCategories
          : prev.skillCategories,
        services: Array.isArray(data.services) ? data.services : prev.services,
        education: Array.isArray(data.education) ? data.education : prev.education,
        certifications: Array.isArray(data.certifications)
          ? data.certifications
          : prev.certifications,
        contact: data.contact || prev.contact,
        settings: data.settings || prev.settings,
        activeResume: data.activeResume ?? null,
      }));
      if (data.settings) {
        configureAnalyticsPolicy({
          enableAnalytics: Boolean(data.settings.enableAnalytics),
          requireCookieConsent: Boolean(data.settings.requireCookieConsent),
        });
        if (typeof data.settings.siteTitle === 'string' && data.settings.siteTitle.trim()) {
          document.title = data.settings.siteTitle;
        }
      }
      setIsHydrated(true);
    } catch {
      // Keep fallback state silently if network is temporarily unavailable
    }
  }, []);

  useEffect(() => {
    refreshPortfolio();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !window.location.pathname.startsWith('/admin')) {
        refreshPortfolio();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [refreshPortfolio]);

  const getResumeDownloadUrl = useCallback(
    (source: string) => {
      const params = new URLSearchParams();
      params.set('src', source);
      if (portfolio.activeResume) {
        params.set('v', String(portfolio.activeResume.versionNumber));
      }
      if (isTrackingPermitted()) {
        params.set('track', '1');
        params.set('vid', getAnonymousVisitorId());
        params.set('sid', getSessionId());
      }
      return `/api/resume/download?${params.toString()}`;
    },
    [portfolio.activeResume]
  );

  return (
    <PortfolioContext.Provider
      value={{ portfolio, isHydrated, refreshPortfolio, getResumeDownloadUrl }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => useContext(PortfolioContext);
