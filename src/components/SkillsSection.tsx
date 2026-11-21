import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Activity,
  BarChart3,
  Bot,
  Braces,
  Code2,
  Cpu,
  Database,
  FileCode2,
  FileSpreadsheet,
  GitBranch,
  KeyRound,
  Layers,
  Layout,
  LineChart,
  PieChart,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
  Wrench,
  Zap,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { EditorialStar } from './TechIcons';
import {
  LogoClaude,
  LogoCursor,
  LogoDjango,
  LogoDocker,
  LogoGitHub,
  LogoHtml5,
  LogoJavaScript,
  LogoMachineLearning,
  LogoPostgres,
  LogoPostman,
  LogoPowerBi,
  LogoPython,
  LogoReact,
  LogoSql,
  LogoTableau,
} from './HeroTechLogos';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  analytics: Code2,
  backend: Server,
  frontend: Layout,
  visualization: BarChart3,
  ai: Bot,
  databases: Database,
  tools: Wrench,
};

const CATEGORY_NAV_CONFIG: Record<string, { label: string; order: number }> = {
  analytics: { label: 'Programming', order: 1 },
  backend: { label: 'Backend', order: 2 },
  frontend: { label: 'Frontend', order: 3 },
  databases: { label: 'Database', order: 4 },
  visualization: { label: 'Data Analytics', order: 5 },
  ai: { label: 'AI / ML', order: 6 },
  tools: { label: 'Tools & Platforms', order: 7 },
};

function renderSkillLogo(name: string, iconUrl: string, categorySlug: string): React.ReactNode {
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        referrerPolicy="no-referrer"
        className="w-4 h-4 object-contain shrink-0 rounded-sm"
      />
    );
  }

  const key = name.trim().toLowerCase();
  if (key === 'python') return <LogoPython className="w-4 h-4 shrink-0" />;
  if (key === 'sql') return <LogoSql className="w-4 h-4 shrink-0" />;
  if (key.includes('react')) return <LogoReact className="w-4 h-4 shrink-0" />;
  if (key === 'javascript') return <LogoJavaScript className="w-4 h-4 shrink-0" />;
  if (key === 'html5') return <LogoHtml5 className="w-4 h-4 shrink-0" />;
  if (key === 'django') return <LogoDjango className="w-4 h-4 shrink-0" />;
  if (key.includes('django rest')) return <Server className="w-4 h-4 text-[#B56AFF] shrink-0" />;
  if (key === 'postgresql') return <LogoPostgres className="w-4 h-4 shrink-0" />;
  if (key.includes('power bi')) return <LogoPowerBi className="w-4 h-4 shrink-0" />;
  if (key === 'tableau') return <LogoTableau className="w-4 h-4 shrink-0" />;
  if (key === 'docker') return <LogoDocker className="w-4 h-4 shrink-0" />;
  if (key === 'github') return <LogoGitHub className="w-4 h-4 shrink-0" />;
  if (key === 'postman') return <LogoPostman className="w-4 h-4 shrink-0" />;
  if (key === 'claude') return <LogoClaude className="w-4 h-4 shrink-0" />;
  if (key === 'cursor') return <LogoCursor className="w-4 h-4 shrink-0" />;
  if (key === 'machine learning' || key === 'scikit-learn') {
    return <LogoMachineLearning className="w-4 h-4 shrink-0" />;
  }

  if (key === 'css3' || key === 'bootstrap') {
    return <FileCode2 className="w-4 h-4 text-[#60A5FA] shrink-0" />;
  }
  if (key.includes('pandas') || key.includes('numpy') || key.includes('excel')) {
    return <FileSpreadsheet className="w-4 h-4 text-[#D3B5FF] shrink-0" />;
  }
  if (key.includes('matplotlib') || key.includes('seaborn') || key.includes('eda') || key.includes('exploratory')) {
    return <LineChart className="w-4 h-4 text-[#60A5FA] shrink-0" />;
  }
  if (key.includes('kpi') || key.includes('business intelligence') || key.includes('visualization')) {
    return <PieChart className="w-4 h-4 text-[#B56AFF] shrink-0" />;
  }
  if (key.includes('jwt')) {
    return <KeyRound className="w-4 h-4 text-[#D3B5FF] shrink-0" />;
  }
  if (key.includes('access control') || key.includes('validation')) {
    return <ShieldCheck className="w-4 h-4 text-[#60A5FA] shrink-0" />;
  }
  if (key.includes('optimization') || key.includes('indexing')) {
    return <Zap className="w-4 h-4 text-[#B56AFF] shrink-0" />;
  }
  if (key.includes('mysql') || key.includes('supabase') || key.includes('database')) {
    return <Database className="w-4 h-4 text-[#60A5FA] shrink-0" />;
  }
  if (key === 'git') {
    return <GitBranch className="w-4 h-4 text-[#D3B5FF] shrink-0" />;
  }
  if (key === 'swagger' || key.includes('rest api')) {
    return <Braces className="w-4 h-4 text-[#60A5FA] shrink-0" />;
  }
  if (key === 'n8n' || key.includes('agentic')) {
    return <Workflow className="w-4 h-4 text-[#B56AFF] shrink-0" />;
  }
  if (key.includes('generative') || key.includes('prompt') || key.includes('ai studio')) {
    return <Sparkles className="w-4 h-4 text-[#D3B5FF] shrink-0" />;
  }
  if (key.includes('language models') || key === 'nlp') {
    return <Cpu className="w-4 h-4 text-[#60A5FA] shrink-0" />;
  }
  if (key.includes('analytics')) {
    return <Activity className="w-4 h-4 text-[#D3B5FF] shrink-0" />;
  }
  if (key.includes('responsive')) {
    return <Layers className="w-4 h-4 text-[#D3B5FF] shrink-0" />;
  }

  const FallbackIcon = CATEGORY_ICONS[categorySlug] || Terminal;
  return <FallbackIcon className="w-4 h-4 text-[#D3B5FF] shrink-0" />;
}

export const SkillsSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const { portfolio } = usePortfolio();
  const categories = portfolio.skillCategories;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const navCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const orderA = CATEGORY_NAV_CONFIG[a.slug]?.order ?? 100 + a.displayOrder;
      const orderB = CATEGORY_NAV_CONFIG[b.slug]?.order ?? 100 + b.displayOrder;
      return orderA - orderB;
    });
  }, [categories]);

  const visibleCategories = useMemo(() => {
    if (selectedCategory === 'all') return categories;
    return categories.filter(
      (cat) => cat.slug === selectedCategory || String(cat.id) === selectedCategory
    );
  }, [categories, selectedCategory]);

  const isSingleCategorySelected = visibleCategories.length === 1;

  return (
    <section
      id="skills"
      className="relative py-20 sm:py-28 border-t border-[#303030] bg-[#080808] overflow-x-clip"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#D3B5FF]">
            <EditorialStar className="w-3.5 h-3.5 text-[#B56AFF] shrink-0" />
            <span>02 · Technical Expertise</span>
          </div>
          <h2
            className="mt-3 font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#D8F0E7] leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            The Technologies Behind My Work.
          </h2>
        </motion.div>

        {/* Responsive Aligned Category Selection Bar */}
        <div
          className="mt-8 w-full rounded-2xl border border-[#303030] bg-[#101010] p-1.5 grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
          role="tablist"
          aria-label="Filter technical skill categories"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
            className={`font-nav min-h-[40px] w-full px-3 py-2 rounded-xl text-xs font-medium inline-flex items-center justify-center text-center whitespace-nowrap transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B56AFF] ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-[#873BFF] to-[#B56AFF] text-[#F8FAFC] shadow-[0_0_18px_rgba(135,59,255,0.35)]'
                : 'text-[#BDBDBD] hover:text-[#D8F0E7] hover:bg-[#191919]'
            }`}
          >
            All
          </button>

          {navCategories.map((cat) => {
            const tabLabel = CATEGORY_NAV_CONFIG[cat.slug]?.label || cat.title;
            const isSelected =
              selectedCategory === cat.slug || selectedCategory === String(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`font-nav min-h-[40px] w-full px-3 py-2 rounded-xl text-xs font-medium inline-flex items-center justify-center text-center whitespace-nowrap transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B56AFF] ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#873BFF] to-[#B56AFF] text-[#F8FAFC] shadow-[0_0_18px_rgba(135,59,255,0.35)]'
                    : 'text-[#BDBDBD] hover:text-[#D8F0E7] hover:bg-[#191919]'
                }`}
              >
                {tabLabel}
              </button>
            );
          })}
        </div>

        {/* Category Cards Grid */}
        <div
          className={`mt-10 grid gap-6 items-stretch ${
            isSingleCategorySelected
              ? 'grid-cols-1 max-w-4xl mx-auto'
              : 'grid-cols-1 lg:grid-cols-2'
          }`}
        >
          {visibleCategories.map((category, idx) => {
            const Icon =
              CATEGORY_ICONS[category.iconKey] || CATEGORY_ICONS[category.slug] || Code2;
            const enabledSkills = category.skills.filter((s) => s.isEnabled);
            const isTrailingOddCard =
              !isSingleCategorySelected &&
              visibleCategories.length % 2 === 1 &&
              idx === visibleCategories.length - 1;

            return (
              <motion.article
                key={category.id}
                layout
                initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: 0.35,
                  delay: Math.min(idx * 0.04, 0.24),
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`group relative h-full rounded-2xl border border-[#303030] bg-[#141414] p-6 sm:p-7 hover:border-[#B56AFF]/60 hover:bg-[#181818] hover:shadow-[0_0_32px_rgba(135,59,255,0.14)] transition-all duration-200 flex flex-col ${
                  isTrailingOddCard ? 'lg:col-span-2 lg:w-[calc(50%-0.75rem)] lg:mx-auto' : ''
                }`}
              >
                {/* Card Header: Icon + Skill Count */}
                <div className="flex items-center justify-between gap-4">
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#191919] border border-[#303030] text-[#D3B5FF] group-hover:text-[#B56AFF] group-hover:border-[#B56AFF]/50 transition-colors shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs text-[#858585] tabular-nums">
                    {enabledSkills.length} {enabledSkills.length === 1 ? 'skill' : 'skills'}
                  </span>
                </div>

                {/* Category Title & Aligned Description */}
                <h3 className="mt-5 font-display text-xl sm:text-2xl font-semibold text-[#E9E9E9] group-hover:text-[#D8F0E7] transition-colors">
                  {category.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#BDBDBD] lg:min-h-[2.85rem]">
                  {category.description}
                </p>

                {/* Uniform Skill Display Boxes */}
                <ul
                  className={`mt-5 pt-5 border-t border-[#303030] grid gap-2.5 content-start flex-1 ${
                    isSingleCategorySelected
                      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                      : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {enabledSkills.map((skill) => (
                    <li
                      key={skill.id}
                      title={skill.name}
                      className="min-h-[44px] px-3 py-2 rounded-xl border border-[#282828] bg-[#0E0E0E] hover:border-[#B56AFF]/50 hover:bg-[#191919] hover:shadow-[0_0_16px_rgba(135,59,255,0.12)] transition-all duration-150 flex items-center gap-2.5"
                    >
                      <span className="w-7 h-7 rounded-lg bg-[#141414] border border-[#303030] flex items-center justify-center shrink-0">
                        {renderSkillLogo(skill.name, skill.iconUrl, category.slug)}
                      </span>
                      <span className="text-xs sm:text-[13px] text-[#E9E9E9]/95 font-medium leading-snug break-words">
                        {skill.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
