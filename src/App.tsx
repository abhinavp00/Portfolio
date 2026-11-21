import { useCallback, useEffect, useRef, useState } from 'react';
import { MotionConfig, AnimatePresence, motion } from 'motion/react';
import { Info, ShieldCheck, X } from 'lucide-react';
import { NAV_ITEMS } from './data/portfolioData';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import {
  getConsentPreference,
  isTrackingPermitted,
  sendSessionHeartbeat,
  setConsentPreference,
  trackEvent,
  type ConsentPreference,
} from './lib/analytics';
import { LoadingScreen } from './components/LoadingScreen';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { SkillsSection } from './components/SkillsSection';
import { ServicesSection } from './components/ServicesSection';
import { ExperienceSection } from './components/ExperienceSection';
import { ProjectsSection } from './components/ProjectsSection';
import { EducationSection } from './components/EducationSection';
import { CertificationsSection } from './components/CertificationsSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { ConsentBanner } from './components/ConsentBanner';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { DashboardView } from './components/admin/DashboardView';
import { ResumeManager } from './components/admin/ResumeManager';
import { EnquiriesManager } from './components/admin/EnquiriesManager';
import {
  ActivityView,
  AnalyticsView,
  type ActivityTabKey,
} from './components/admin/AnalyticsViews';
import { SettingsView, VisitorsView } from './components/admin/VisitorsAndSettingsViews';
import {
  ContactManager,
  ProfileManager,
} from './components/admin/ProfileAndContactManagers';
import {
  ExperienceManager,
  ProjectsManager,
} from './components/admin/ExperienceAndProjectsManagers';
import {
  CertificationsManager,
  EducationManager,
  ServicesManager,
  SkillsManager,
} from './components/admin/CatalogManagers';

function PublicPortfolioShell({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { portfolio, isHydrated } = usePortfolio();
  const [loaded, setLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [consent, setConsent] = useState<ConsentPreference>(() => getConsentPreference());
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const pageTrackedRef = useRef(false);

  const handleNotify = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const fireInitialTelemetry = useCallback(() => {
    if (!isHydrated || pageTrackedRef.current) return;
    if (!isTrackingPermitted()) return;
    pageTrackedRef.current = true;
    trackEvent('session_start', {
      source: 'landing',
      section: 'home',
      dedupeKey: 'initial_session',
    });
    trackEvent('page_view', {
      source: 'landing',
      section: 'home',
      dedupeKey: 'initial_page_view',
    });
    sendSessionHeartbeat();
  }, [isHydrated]);

  useEffect(() => {
    fireInitialTelemetry();
  }, [fireInitialTelemetry, consent]);

  // Periodic engagement heartbeat for accurate average session duration
  useEffect(() => {
    if (!isHydrated) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        sendSessionHeartbeat();
      }
    }, 20000);

    const handleHide = () => {
      if (document.visibilityState === 'hidden') {
        sendSessionHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', handleHide);
    window.addEventListener('pagehide', sendSessionHeartbeat);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleHide);
      window.removeEventListener('pagehide', sendSessionHeartbeat);
    };
  }, [isHydrated]);

  // Observe visible sections for active navbar state & section_view telemetry
  useEffect(() => {
    const sectionIds = NAV_ITEMS.map((item) => item.id);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          const id = visible[0].target.id;
          setActiveSection(id);
          trackEvent('section_view', {
            section: id,
            source: 'scroll_observer',
            dedupeKey: id,
          });
        }
      },
      {
        rootMargin: '-25% 0px -55% 0px',
        threshold: [0.1, 0.25, 0.5],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loaded]);

  const handleAcceptConsent = () => {
    setConsentPreference('granted');
    setConsent('granted');
    setPrivacyModalOpen(false);
    setTimeout(() => fireInitialTelemetry(), 0);
  };

  const handleDeclineConsent = () => {
    setConsentPreference('denied');
    setConsent('denied');
    setPrivacyModalOpen(false);
  };

  const showBanner =
    isHydrated &&
    portfolio.settings.enableAnalytics &&
    portfolio.settings.requireCookieConsent &&
    consent === 'unset';

  return (
    <div className="min-h-screen bg-[#080808] text-[#BDBDBD] flex flex-col">
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}

      {portfolio.settings.maintenanceMode && (
        <div className="bg-[#191919] border-b border-[#B56AFF]/40 px-4 py-2 text-center text-xs text-[#D8F0E7]">
          Portfolio updates are currently in progress. All contact channels remain active.
        </div>
      )}

      <Navbar activeSection={activeSection} onNotify={handleNotify} />

      <main className="flex-1">
        <HeroSection ready={loaded} />
        <AboutSection />
        <SkillsSection />
        <ServicesSection />
        <ExperienceSection />
        <ProjectsSection />
        <EducationSection />
        <CertificationsSection />
        <ContactSection />
      </main>

      <Footer
        onNotify={handleNotify}
        onNavigate={onNavigate}
        onOpenPrivacy={() => setPrivacyModalOpen(true)}
      />

      <ConsentBanner
        visible={showBanner}
        onAccept={handleAcceptConsent}
        onDecline={handleDeclineConsent}
      />

      {/* Privacy Preferences Modal */}
      {privacyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Privacy and Analytics Preferences"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#303030] bg-[#141414] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#B56AFF]" />
                <h2 className="font-display text-lg font-semibold text-[#D8F0E7]">
                  Privacy &amp; Analytics Settings
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(false)}
                className="text-[#858585] hover:text-[#D8F0E7]"
                aria-label="Close privacy modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#BDBDBD]">
              We collect only anonymized session telemetry (page views, project interest, and link
              clicks) without invasive fingerprinting, raw IP storage, or message tracking.
            </p>
            <p className="mt-2 text-xs text-[#858585]">
              Current preference:{' '}
              <strong className="text-[#D3B5FF] uppercase">{consent}</strong>
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleDeclineConsent}
                className="font-nav px-4 py-2 rounded-full border border-[#303030] bg-[#101010] text-xs font-medium text-[#BDBDBD] hover:text-[#D8F0E7]"
              >
                Opt Out
              </button>
              <button
                type="button"
                onClick={handleAcceptConsent}
                className="font-nav px-4 py-2 rounded-full bg-gradient-to-r from-[#873BFF] to-[#B56AFF] text-xs font-medium text-[#F8FAFC]"
              >
                Allow Analytics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subtle Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            role="status"
            className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-[#B56AFF]/50 bg-[#141414]/95 backdrop-blur-md px-4 py-3 shadow-xl flex items-start gap-2.5 text-xs text-[#D8F0E7]"
          >
            <Info className="w-4 h-4 text-[#B56AFF] shrink-0 mt-0.5" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminRouter({
  currentPath,
  currentSearch,
  onNavigate,
}: {
  currentPath: string;
  currentSearch: string;
  onNavigate: (path: string) => void;
}) {
  const { adminProfile, loading } = useAdminAuth();

  useEffect(() => {
    if (!loading && !adminProfile && currentPath !== '/admin/login') {
      onNavigate('/admin/login');
    }
    if (!loading && adminProfile && (currentPath === '/admin' || currentPath === '/admin/')) {
      onNavigate('/admin/dashboard');
    }
  }, [loading, adminProfile, currentPath, onNavigate]);

  if (currentPath === '/admin/login') {
    return <AdminLoginPage onNavigate={onNavigate} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#3B82F6] border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-[#94A3B8]">Verifying administrator session...</p>
        </div>
      </div>
    );
  }

  if (!adminProfile) {
    return <AdminLoginPage onNavigate={onNavigate} />;
  }

  const searchParams = new URLSearchParams(currentSearch);
  const tabParam = searchParams.get('tab');

  const renderAdminView = () => {
    switch (currentPath) {
      case '/admin':
      case '/admin/':
      case '/admin/dashboard':
        return <DashboardView onNavigate={onNavigate} />;
      case '/admin/profile':
        return <ProfileManager />;
      case '/admin/experience':
        return <ExperienceManager />;
      case '/admin/projects':
        return <ProjectsManager />;
      case '/admin/skills':
        return <SkillsManager />;
      case '/admin/services':
        return <ServicesManager />;
      case '/admin/education':
        return <EducationManager />;
      case '/admin/certifications':
        return <CertificationsManager />;
      case '/admin/contact':
        return <ContactManager />;
      case '/admin/resume':
        return <ResumeManager />;
      case '/admin/enquiries':
        return <EnquiriesManager initialTab={tabParam === 'history' ? 'history' : 'inbox'} />;
      case '/admin/analytics':
        return <AnalyticsView />;
      case '/admin/visitors':
        return <VisitorsView />;
      case '/admin/activity': {
        const validTab: ActivityTabKey =
          tabParam === 'social' ||
          tabParam === 'contact' ||
          tabParam === 'resume' ||
          tabParam === 'projects'
            ? tabParam
            : 'all';
        return <ActivityView initialTab={validTab} />;
      }
      case '/admin/settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={onNavigate} />;
    }
  };

  return (
    <AdminLayout currentPath={currentPath} onNavigate={onNavigate}>
      {renderAdminView()}
    </AdminLayout>
  );
}

export default function App() {
  const [locationState, setLocationState] = useState(() => ({
    pathname: window.location.pathname || '/',
    search: window.location.search || '',
  }));

  useEffect(() => {
    const handlePop = () => {
      setLocationState({
        pathname: window.location.pathname || '/',
        search: window.location.search || '',
      });
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigate = useCallback((target: string) => {
    const url = new URL(target, window.location.origin);
    window.history.pushState({}, '', `${url.pathname}${url.search}`);
    setLocationState({ pathname: url.pathname, search: url.search });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const isAdminRoute = locationState.pathname.startsWith('/admin');

  useEffect(() => {
    const robotsMeta = document.querySelector('meta[name="robots"]');
    if (robotsMeta) {
      robotsMeta.setAttribute('content', isAdminRoute ? 'noindex, nofollow' : 'index, follow');
    }
    if (isAdminRoute) {
      document.title = 'Admin Portal | Abhinav P Portfolio';
    } else {
      document.title = 'Abhinav P | Data Analytics & Python Full Stack Developer';
    }
  }, [isAdminRoute]);

  if (isAdminRoute) {
    return (
      <AdminAuthProvider>
        <AdminRouter
          currentPath={locationState.pathname}
          currentSearch={locationState.search}
          onNavigate={navigate}
        />
      </AdminAuthProvider>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <PortfolioProvider>
        <PublicPortfolioShell onNavigate={navigate} />
      </PortfolioProvider>
    </MotionConfig>
  );
}
