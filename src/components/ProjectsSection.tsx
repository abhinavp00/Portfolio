import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ArrowUpRight,
  Calendar,
  Car,
  CheckCircle2,
  Database,
  ExternalLink,
  FolderGit2,
  Github,
  Globe,
  Layers,
  LineChart,
  X,
} from 'lucide-react';
import { resolveProjectImage, usePortfolio } from '../context/PortfolioContext';
import { trackEvent } from '../lib/analytics';
import type { ProjectData } from '../types/portfolio';
import { EditorialStar } from './TechIcons';

const InteractiveProjectPreview: React.FC<{ project: ProjectData }> = ({ project }) => {
  const [assetFilter, setAssetFilter] = useState<'all' | 'active' | 'maintenance'>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('Sedan · Automatic');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'lr' | 'rf' | 'svm'>('rf');

  if (project.previewType === 'assetsphere') {
    const rows = [
      { code: 'AST-1042', item: 'Dell Latitude 5540', dept: 'Engineering', status: 'active' as const },
      { code: 'AST-1089', item: 'Cisco Catalyst Switch', dept: 'Infrastructure', status: 'active' as const },
      { code: 'AST-1104', item: 'HP ZBook Workstation', dept: 'Analytics', status: 'maintenance' as const },
      { code: 'AST-1127', item: 'MacBook Pro 14"', dept: 'Product', status: 'active' as const },
    ];
    const filteredRows =
      assetFilter === 'all' ? rows : rows.filter((r) => r.status === assetFilter);

    return (
      <div className="rounded-xl border border-[#303030] bg-[#080808] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-[#D3B5FF]">
              Interface Preview · AssetSphere Admin Console
            </p>
            <p className="text-xs text-[#BDBDBD] mt-0.5">
              Multi-role tracking, lifecycle filtering &amp; optimized SQL reporting
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-full bg-[#141414] border border-[#303030]">
            {(['all', 'active', 'maintenance'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setAssetFilter(tab)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                  assetFilter === tab
                    ? 'bg-gradient-to-r from-[#873BFF] to-[#B56AFF] text-[#F8FAFC]'
                    : 'text-[#BDBDBD] hover:text-[#D8F0E7]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-[#303030] bg-[#141414] p-3">
            <span className="font-mono text-[11px] text-[#858585]">Report Speedup</span>
            <p className="mt-1 font-display text-base sm:text-lg font-semibold text-[#D3B5FF] tabular-nums">
              ~40% Faster
            </p>
          </div>
          <div className="rounded-lg border border-[#303030] bg-[#141414] p-3">
            <span className="font-mono text-[11px] text-[#858585]">API Coverage</span>
            <p className="mt-1 font-display text-base sm:text-lg font-semibold text-[#D8F0E7]">
              Pytest Suite
            </p>
          </div>
          <div className="rounded-lg border border-[#303030] bg-[#141414] p-3">
            <span className="font-mono text-[11px] text-[#858585]">Export Engine</span>
            <p className="mt-1 font-display text-base sm:text-lg font-semibold text-[#D8F0E7]">
              CSV &amp; Bulk Ops
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#303030]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141414] text-[#BDBDBD] font-mono">
              <tr>
                <th className="px-3 py-2 font-medium">Asset ID</th>
                <th className="px-3 py-2 font-medium">Hardware</th>
                <th className="px-3 py-2 font-medium">Department</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#303030] text-[#E9E9E9]">
              {filteredRows.map((row) => (
                <tr key={row.code} className="bg-[#101010]">
                  <td className="px-3 py-2 font-mono tabular-nums text-[#D3B5FF]">{row.code}</td>
                  <td className="px-3 py-2">{row.item}</td>
                  <td className="px-3 py-2 text-[#BDBDBD]">{row.dept}</td>
                  <td className="px-3 py-2 capitalize">
                    {row.status === 'active' ? 'Active' : 'Maintenance'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (project.previewType === 'rentacar') {
    const vehicles = [
      { label: 'Sedan · Automatic', spec: '5 Seats · JWT Protected Booking' },
      { label: 'SUV · Hybrid', spec: '7 Seats · Composite Index Lookup' },
      { label: 'Hatchback · Manual', spec: '4 Seats · Overlap Validation' },
    ];
    return (
      <div className="rounded-xl border border-[#303030] bg-[#080808] p-4 sm:p-5 space-y-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[#D3B5FF]">
            Interface Preview · Rent-A-Car Booking Flow
          </p>
          <p className="text-xs text-[#BDBDBD] mt-0.5">
            Concurrent-booking validation, JWT session management &amp; MySQL index lookups
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {vehicles.map((v) => {
            const active = selectedVehicle === v.label;
            return (
              <button
                key={v.label}
                type="button"
                onClick={() => {
                  setSelectedVehicle(v.label);
                  setBookingConfirmed(false);
                }}
                className={`text-left rounded-lg border p-3 transition-colors ${
                  active
                    ? 'border-[#B56AFF] bg-[#191919]'
                    : 'border-[#303030] bg-[#141414] hover:border-[#858585]'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-[#D8F0E7]">
                  <Car className="w-4 h-4 text-[#B56AFF]" />
                  <span>{v.label}</span>
                </div>
                <p className="mt-1.5 text-[11px] text-[#BDBDBD]">{v.spec}</p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-[#303030] bg-[#141414] p-3.5">
          <div className="text-xs">
            <span className="text-[#858585]">Selected Class: </span>
            <span className="font-medium text-[#D8F0E7]">{selectedVehicle}</span>
            <p className="mt-0.5 font-mono text-[11px] text-[#D3B5FF]">
              {bookingConfirmed
                ? 'Availability check passed — zero overlapping booking conflict'
                : 'Click validate to simulate concurrent-booking check'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBookingConfirmed(true)}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#873BFF] to-[#B56AFF] hover:brightness-110 text-xs font-medium text-[#F8FAFC] whitespace-nowrap shrink-0 transition-all"
          >
            {bookingConfirmed ? 'Slot Verified' : 'Check Availability'}
          </button>
        </div>
      </div>
    );
  }

  if (project.previewType === 'ml') {
    const models = {
      lr: {
        name: 'Logistic Regression',
        role: 'Interpretable linear baseline with categorical encoding',
        focus: 'Evaluated with Accuracy, Precision, Recall, F1-Score, and ROC-AUC',
      },
      rf: {
        name: 'Random Forest Classifier',
        role: 'Ensemble decision trees capturing non-linear feature interactions',
        focus: 'Feature importance & conversion driver exploration via Seaborn',
      },
      svm: {
        name: 'Support Vector Machine',
        role: 'Margin-based classification on scaled lead attributes',
        focus: 'Cross-checked against F1-Score and ROC-AUC trade-offs',
      },
    };

    return (
      <div className="rounded-xl border border-[#303030] bg-[#080808] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-[#D3B5FF]">
              Pipeline Preview · Model Evaluation Architecture
            </p>
            <p className="text-xs text-[#BDBDBD] mt-0.5">
              Compare trained Scikit-learn classifiers evaluated across the pipeline
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-full bg-[#141414] border border-[#303030]">
            {(['lr', 'rf', 'svm'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedModel(m)}
                className={`px-3 py-1 rounded-full text-xs font-mono uppercase transition-colors ${
                  selectedModel === m
                    ? 'bg-gradient-to-r from-[#873BFF] to-[#B56AFF] text-[#F8FAFC]'
                    : 'text-[#BDBDBD] hover:text-[#D8F0E7]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#303030] bg-[#141414] p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#D8F0E7]">
            <LineChart className="w-4 h-4 text-[#B56AFF]" />
            <span>{models[selectedModel].name}</span>
          </div>
          <p className="text-xs text-[#BDBDBD]">{models[selectedModel].role}</p>
          <p className="font-mono text-[11px] text-[#D3B5FF] pt-1">
            {models[selectedModel].focus}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#303030] bg-[#080808] p-5 space-y-3">
      <p className="font-mono text-[11px] uppercase tracking-wider text-[#D3B5FF]">
        Architecture Stack · {project.title}
      </p>
      <p className="text-sm text-[#BDBDBD] leading-relaxed">{project.description}</p>
      <div className="pt-2 flex flex-wrap gap-2">
        {project.stack.map((tech) => (
          <span
            key={tech}
            className="font-mono text-xs px-2.5 py-1 rounded-md border border-[#303030] bg-[#141414] text-[#D8F0E7]"
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
};

export const ProjectsSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const { portfolio } = usePortfolio();
  const projectsList = portfolio.projects;
  const [activeProject, setActiveProject] = useState<ProjectData | null>(null);
  const [modalTab, setModalTab] = useState<'overview' | 'preview'>('overview');
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const slug = el.dataset.projectSlug;
            const title = el.dataset.projectTitle;
            if (slug) {
              trackEvent('project_view', {
                source: 'projects_grid',
                section: 'projects',
                projectId: slug,
                projectTitle: title || slug,
                dedupeKey: slug,
              });
            }
          }
        }
      },
      { threshold: 0.45 }
    );

    cardRefs.current.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [projectsList]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveProject(null);
      }
    };
    if (activeProject) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeProject]);

  const openProjectModal = (project: ProjectData) => {
    setModalTab('overview');
    setActiveProject(project);
    trackEvent('project_detail_view', {
      source: 'project_card',
      section: 'projects',
      projectId: project.slug,
      projectTitle: project.title,
    });
  };

  return (
    <section
      id="projects"
      className="relative py-20 sm:py-28 border-t border-[#303030] bg-[#101010]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#D3B5FF]">
            <EditorialStar className="w-3.5 h-3.5 text-[#B56AFF] shrink-0" />
            <span>05 · Selected Work</span>
          </div>
          <h2
            className="mt-3 font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#D8F0E7] leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            Projects That Demonstrate My Capabilities.
          </h2>
        </motion.div>

        {/* 3-Column Responsive Project Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectsList.map((project, idx) => {
            const resolvedImg = resolveProjectImage(project.imageUrl);
            return (
              <motion.article
                key={project.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(project.slug, el);
                  else cardRefs.current.delete(project.slug);
                }}
                data-project-slug={project.slug}
                data-project-title={project.title}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: 0.4,
                  delay: idx * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group rounded-2xl border border-[#303030] bg-[#141414] overflow-hidden hover:border-[#B56AFF]/70 hover:-translate-y-1 hover:shadow-[0_0_35px_rgba(135,59,255,0.16)] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Project Visual Thumbnail */}
                  <div
                    onClick={() => openProjectModal(project)}
                    className="relative aspect-[4/3] w-full overflow-hidden bg-[#080808] border-b border-[#303030] cursor-pointer"
                  >
                    {resolvedImg && !imgErrors[project.slug] ? (
                      <img
                        src={resolvedImg}
                        alt={project.imageAlt || project.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setImgErrors((prev) => ({ ...prev, [project.slug]: true }))
                        }
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#141414] p-6 text-center">
                        <Layers className="w-10 h-10 text-[#B56AFF] mb-2" />
                        <span className="font-display text-sm font-semibold text-[#D8F0E7]">
                          {project.title}
                        </span>
                      </div>
                    )}
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141414]/85 via-transparent to-transparent"
                      aria-hidden="true"
                    />
                    <span className="absolute top-3.5 left-3.5 font-mono text-xs font-semibold text-[#D8F0E7] bg-[#080808]/85 backdrop-blur-sm px-2.5 py-1 rounded-md border border-[#303030] tabular-nums">
                      {project.numberLabel}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-[#D3B5FF]">
                      <span>{project.category}</span>
                      {project.completed && (
                        <>
                          <span className="text-[#858585]" aria-hidden="true">·</span>
                          <span className="text-[#858585]">{project.completed}</span>
                        </>
                      )}
                    </div>

                    <h3 className="mt-2.5 font-display text-2xl font-semibold text-[#E9E9E9] group-hover:text-[#D8F0E7] transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs font-medium text-[#858585] mt-0.5">
                      {project.fullTitle}
                    </p>

                    <p className="mt-3 text-sm leading-relaxed text-[#BDBDBD]">
                      {project.description}
                    </p>

                    {/* Key Achievement Highlights (Top 2) */}
                    <ul className="mt-4 space-y-1.5 text-xs text-[#E9E9E9]/90">
                      {project.contributions.slice(0, 2).map((achievement, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#B56AFF] shrink-0 mt-0.5" />
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Stack list */}
                    <div className="mt-4 pt-4 border-t border-[#303030]">
                      <p className="font-mono text-[11px] text-[#858585] leading-relaxed">
                        {project.stack.join(' · ')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-6 pb-6 pt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openProjectModal(project)}
                    className="font-nav inline-flex items-center gap-1.5 text-sm font-medium text-[#D8F0E7] hover:text-[#D3B5FF] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B56AFF] rounded"
                  >
                    <span>View Details</span>
                    <ArrowUpRight className="w-4 h-4 text-[#B56AFF] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    {project.liveDemoUrl && (
                      <a
                        href={project.liveDemoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          trackEvent('external_link_click', {
                            source: 'project_card',
                            section: 'projects',
                            destination: 'live_demo',
                            projectId: project.slug,
                            projectTitle: project.title,
                          })
                        }
                        className="font-nav inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#303030] bg-[#101010] hover:border-[#B56AFF] text-xs font-medium text-[#D3B5FF] whitespace-nowrap shrink-0 transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Demo</span>
                      </a>
                    )}

                    {project.githubUrl ? (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          trackEvent('github_click', {
                            source: 'project_card',
                            section: 'projects',
                            destination: 'github',
                            projectId: project.slug,
                            projectTitle: project.title,
                          })
                        }
                        className="font-nav inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#303030] bg-[#101010] hover:border-[#B56AFF] text-xs font-medium text-[#E9E9E9] whitespace-nowrap shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B56AFF]"
                      >
                        <Github className="w-3.5 h-3.5 text-[#D3B5FF]" />
                        <span>GitHub</span>
                      </a>
                    ) : (
                      !project.liveDemoUrl && (
                        <span className="font-mono text-[11px] text-[#858585]">
                          Case Study
                        </span>
                      )
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>

      {/* Project Details Modal */}
      <AnimatePresence>
        {activeProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
            onClick={() => setActiveProject(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
          >
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#303030] bg-[#141414] shadow-[0_24px_80px_rgba(0,0,0,0.75)]"
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-6 py-5 border-b border-[#303030] bg-[#141414]/95 backdrop-blur-md">
                <div>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#D3B5FF]">
                    <span>Project {activeProject.numberLabel}</span>
                    <span className="text-[#858585]" aria-hidden="true">·</span>
                    <span>{activeProject.category}</span>
                    {activeProject.completed && (
                      <>
                        <span className="text-[#858585]" aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-[#BDBDBD]">
                          <Calendar className="w-3.5 h-3.5 text-[#B56AFF]" />
                          {activeProject.completed}
                        </span>
                      </>
                    )}
                  </div>
                  <h3
                    id="project-modal-title"
                    className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-[#D8F0E7]"
                  >
                    {activeProject.title} — {activeProject.fullTitle}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveProject(null)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#303030] bg-[#101010] text-[#BDBDBD] hover:text-[#D8F0E7] hover:border-[#B56AFF] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B56AFF]"
                  aria-label="Close project details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Interactive Tab Switcher */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#101010] border border-[#303030]">
                    <button
                      type="button"
                      onClick={() => setModalTab('overview')}
                      className={`font-nav px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        modalTab === 'overview'
                          ? 'bg-gradient-to-r from-[#873BFF] to-[#B56AFF] text-[#F8FAFC]'
                          : 'text-[#BDBDBD] hover:text-[#D8F0E7]'
                      }`}
                    >
                      Architecture &amp; Contributions
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalTab('preview')}
                      className={`font-nav px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        modalTab === 'preview'
                          ? 'bg-gradient-to-r from-[#873BFF] to-[#B56AFF] text-[#F8FAFC]'
                          : 'text-[#BDBDBD] hover:text-[#D8F0E7]'
                      }`}
                    >
                      Interactive UI Preview
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {activeProject.liveDemoUrl && (
                      <a
                        href={activeProject.liveDemoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          trackEvent('external_link_click', {
                            source: 'project_modal',
                            section: 'projects',
                            destination: 'live_demo',
                            projectId: activeProject.slug,
                            projectTitle: activeProject.title,
                          })
                        }
                        className="font-nav inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#873BFF] to-[#B56AFF] text-xs font-medium text-[#F8FAFC] transition-all"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Live Demo</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {activeProject.githubUrl && (
                      <a
                        href={activeProject.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          trackEvent('github_click', {
                            source: 'project_modal',
                            section: 'projects',
                            destination: 'github',
                            projectId: activeProject.slug,
                            projectTitle: activeProject.title,
                          })
                        }
                        className="font-nav inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#101010] border border-[#303030] hover:border-[#B56AFF] text-xs font-medium text-[#D8F0E7] transition-colors"
                      >
                        <FolderGit2 className="w-4 h-4 text-[#B56AFF]" />
                        <span>View Repository on GitHub</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#858585]" />
                      </a>
                    )}
                  </div>
                </div>

                {modalTab === 'overview' ? (
                  <div className="space-y-6">
                    {resolveProjectImage(activeProject.imageUrl) && (
                      <div className="rounded-xl overflow-hidden border border-[#303030] bg-[#080808]">
                        <img
                          src={resolveProjectImage(activeProject.imageUrl)}
                          alt={activeProject.imageAlt || activeProject.title}
                          referrerPolicy="no-referrer"
                          className="w-full max-h-72 object-cover"
                        />
                      </div>
                    )}

                    <div>
                      <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#858585]">
                        Project Overview
                      </h4>
                      <p className="mt-2 text-sm sm:text-base leading-relaxed text-[#E9E9E9]">
                        {activeProject.description}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#858585]">
                        Key Contributions &amp; Engineering Outcomes
                      </h4>
                      <ul className="mt-3 space-y-2.5">
                        {activeProject.contributions.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 text-sm text-[#BDBDBD]"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#B56AFF] shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-[#303030]">
                      <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#858585] flex items-center gap-2">
                        <Database className="w-4 h-4 text-[#B56AFF]" />
                        <span>Technology Stack</span>
                      </h4>
                      <p className="mt-2 font-mono text-xs sm:text-sm text-[#D3B5FF]">
                        {activeProject.stack.join(' · ')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <InteractiveProjectPreview project={activeProject} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
