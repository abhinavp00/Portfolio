import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  BarChart2,
  Cpu,
  Database,
  Layers,
  Server,
  Sparkles,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { EditorialStar } from './TechIcons';

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  barChart: BarChart2,
  server: Server,
  layers: Layers,
  database: Database,
  sparkles: Sparkles,
  cpu: Cpu,
};

export const ServicesSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const { portfolio } = usePortfolio();

  return (
    <section
      id="services"
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
            <span>03 · What I Do</span>
          </div>
          <h2
            className="mt-3 font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#D8F0E7] leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            Building Solutions Beyond Code.
          </h2>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {portfolio.services.map((service, idx) => {
            const Icon = SERVICE_ICONS[service.iconName] || Sparkles;
            return (
              <motion.article
                key={service.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: 0.35,
                  delay: idx * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group rounded-2xl border border-[#303030] bg-[#141414] p-6 sm:p-7 hover:border-[#B56AFF]/60 hover:bg-[#191919] hover:shadow-[0_0_28px_rgba(135,59,255,0.12)] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#191919] border border-[#303030] text-[#B56AFF] group-hover:text-[#D3B5FF] group-hover:border-[#B56AFF]/50 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs font-semibold text-[#858585] tabular-nums">
                      {service.numberLabel}
                    </span>
                  </div>

                  <h3 className="mt-5 font-display text-xl font-semibold text-[#E9E9E9] group-hover:text-[#D8F0E7] transition-colors">
                    {service.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#BDBDBD]">
                    {service.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#303030]">
                  <p className="font-mono text-xs text-[#D3B5FF]/85 leading-relaxed">
                    {service.technologies.join(' · ')}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
