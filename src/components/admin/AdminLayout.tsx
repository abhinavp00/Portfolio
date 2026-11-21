import React, { useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  Briefcase,
  Code2,
  ExternalLink,
  FileText,
  FolderKanban,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MousePointerClick,
  Phone,
  Settings,
  Share2,
  Sparkles,
  UserCheck,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export interface AdminNavItem {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        id: 'dashboard',
        path: '/admin/dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
    ],
  },
  {
    title: 'Portfolio Management',
    items: [
      {
        id: 'profile',
        path: '/admin/profile',
        label: 'Profile & About',
        icon: <UserCircle className="w-4 h-4" />,
      },
      {
        id: 'experience',
        path: '/admin/experience',
        label: 'Experience',
        icon: <Briefcase className="w-4 h-4" />,
      },
      {
        id: 'projects',
        path: '/admin/projects',
        label: 'Projects',
        icon: <FolderKanban className="w-4 h-4" />,
      },
      {
        id: 'skills',
        path: '/admin/skills',
        label: 'Skills & Technologies',
        icon: <Code2 className="w-4 h-4" />,
      },
      {
        id: 'services',
        path: '/admin/services',
        label: 'Services',
        icon: <Sparkles className="w-4 h-4" />,
      },
      {
        id: 'education',
        path: '/admin/education',
        label: 'Education',
        icon: <GraduationCap className="w-4 h-4" />,
      },
      {
        id: 'certifications',
        path: '/admin/certifications',
        label: 'Certifications',
        icon: <Award className="w-4 h-4" />,
      },
      {
        id: 'contact',
        path: '/admin/contact',
        label: 'Contact Info',
        icon: <Phone className="w-4 h-4" />,
      },
      {
        id: 'resume',
        path: '/admin/resume',
        label: 'Resume Manager',
        icon: <FileText className="w-4 h-4" />,
      },
    ],
  },
  {
    title: 'Communication',
    items: [
      {
        id: 'enquiries',
        path: '/admin/enquiries',
        label: 'Enquiries',
        icon: <Mail className="w-4 h-4" />,
      },
      {
        id: 'enquiry-history',
        path: '/admin/enquiries?tab=history',
        label: 'Enquiry History',
        icon: <History className="w-4 h-4" />,
      },
    ],
  },
  {
    title: 'Analytics',
    items: [
      {
        id: 'analytics',
        path: '/admin/analytics',
        label: 'Analytics Overview',
        icon: <BarChart3 className="w-4 h-4" />,
      },
      {
        id: 'visitors',
        path: '/admin/visitors',
        label: 'Visitors & Sessions',
        icon: <Users className="w-4 h-4" />,
      },
      {
        id: 'social-clicks',
        path: '/admin/activity?tab=social',
        label: 'Social Clicks',
        icon: <Share2 className="w-4 h-4" />,
      },
      {
        id: 'contact-clicks',
        path: '/admin/activity?tab=contact',
        label: 'Contact Clicks',
        icon: <MousePointerClick className="w-4 h-4" />,
      },
      {
        id: 'resume-downloads',
        path: '/admin/activity?tab=resume',
        label: 'Resume Downloads',
        icon: <FileText className="w-4 h-4" />,
      },
      {
        id: 'project-engagement',
        path: '/admin/activity?tab=projects',
        label: 'Project Engagement',
        icon: <FolderKanban className="w-4 h-4" />,
      },
      {
        id: 'activity-logs',
        path: '/admin/activity',
        label: 'Activity Logs',
        icon: <Activity className="w-4 h-4" />,
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        id: 'settings',
        path: '/admin/settings',
        label: 'Settings & Privacy',
        icon: <Settings className="w-4 h-4" />,
      },
    ],
  },
];

interface AdminLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentPath,
  onNavigate,
  children,
}) => {
  const { adminProfile, signOutAdmin } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActivePath = (itemPath: string) => {
    const currentFull = `${window.location.pathname}${window.location.search}`;
    if (itemPath.includes('?')) {
      return currentFull === itemPath;
    }
    if (itemPath === '/admin/activity') {
      return window.location.pathname === '/admin/activity' && !window.location.search;
    }
    if (itemPath === '/admin/enquiries') {
      return window.location.pathname === '/admin/enquiries' && !window.location.search;
    }
    return currentPath === itemPath;
  };

  const handleNav = (path: string) => {
    setSidebarOpen(false);
    onNavigate(path);
  };

  const handleLogout = async () => {
    await signOutAdmin();
    onNavigate('/admin/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0D1220] border-r border-slate-800/90">
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleNav('/admin/dashboard')}
          className="text-left focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]" />
            <span className="text-sm font-semibold tracking-wide text-[#F8FAFC] uppercase">
              Abhinav P
            </span>
          </div>
          <p className="mt-0.5 text-[11px] font-mono text-[#94A3B8]">Admin &amp; Analytics</p>
        </button>

        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-[#94A3B8] hover:text-white"
          aria-label="Close navigation menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Admin Navigation">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-slate-500">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActivePath(item.path);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.path)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                      active
                        ? 'bg-gradient-to-r from-[#3B82F6]/20 to-[#8B5CF6]/15 text-[#F8FAFC] border border-[#3B82F6]/40'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172033]/70 border border-transparent'
                    }`}
                  >
                    <span className={active ? 'text-[#3B82F6]' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800/80 space-y-2">
        <div className="px-3 py-2 rounded-xl bg-[#111827] border border-slate-800/80 flex items-center gap-2.5">
          <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#F8FAFC] truncate">
              {adminProfile?.displayName || 'Abhinav P'}
            </p>
            <p className="text-[11px] text-[#94A3B8] truncate">{adminProfile?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-800 bg-[#111827] hover:border-red-500/40 hover:text-red-300 text-xs font-medium text-[#94A3B8] transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 w-68 max-w-[85vw] h-full">{sidebarContent}</aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-14 border-b border-slate-800/80 bg-[#080B14]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin sidebar"
              className="lg:hidden p-2 rounded-xl border border-slate-800 bg-[#111827] text-[#F8FAFC]"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#94A3B8]">
              <span className="font-mono text-[#3B82F6]">ADMIN</span>
              <span>/</span>
              <span className="text-[#F8FAFC] font-medium capitalize">
                {currentPath.replace('/admin/', '').replace('/', ' ') || 'dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#111827] hover:border-[#3B82F6]/60 px-3 py-1.5 text-xs font-medium text-[#F8FAFC] transition-colors"
            >
              <span>View Live Portfolio</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#3B82F6]" />
            </a>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
