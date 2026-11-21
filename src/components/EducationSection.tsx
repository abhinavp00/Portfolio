import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Award, GraduationCap } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { EditorialStar } from './TechIcons';

export const EducationSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const { portfolio } = usePortfolio();

  return (
    <section id="education" className="relative py-20 sm:py-28 border-t border-[#303030] bg-[#080808]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#D3B5FF]">
            <EditorialStar className="w-3.5 h-3.5 text-[#B56AFF] shrink-0" />
            <span>06 · Education</span>
          </div>
          <h2
            className="mt-3 font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#D8F0E7] leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            Academic Background.
          </h2>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {portfolio.education.map((edu, idx) => (
            <motion.article
              key={edu.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                duration: 0.38,
                delay: idx * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group rounded-2xl border border-[#303030] bg-[#141414] p-6 sm:p-8 hover:border-[#B56AFF]/60 hover:bg-[#191919] hover:shadow-[0_0_28px_rgba(135,59,255,0.12)] transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#191919] border border-[#303030] text-[#B56AFF] group-hover:text-[#D3B5FF] transition-colors">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs text-[#858585] tabular-nums">
                    {edu.periodLabel ||
                      [edu.startDate, edu.completionDate].filter(Boolean).join(' – ')}
                  </span>
                </div>

                <h3 className="mt-5 font-display text-2xl font-semibold text-[#E9E9E9] group-hover:text-[#D8F0E7] transition-colors">
                  {edu.qualification}
                </h3>
                <p className="mt-2 text-sm font-medium text-[#BDBDBD]">
                  {edu.institution}
                </p>
                {edu.university && (
                  <p className="mt-0.5 text-xs text-[#858585]">
                    Affiliated to {edu.university}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-[#303030] flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-[#858585]">
                  Academic Performance
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-[#D3B5FF] tabular-nums">
                  <Award className="w-4 h-4 text-[#B56AFF]" />
                  <span>{edu.performance}</span>
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
