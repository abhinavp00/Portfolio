import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Briefcase, Calendar, MapPin } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { EditorialStar } from './TechIcons';

export const ExperienceSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const { portfolio } = usePortfolio();

  return (
    <section id="experience" className="relative py-20 sm:py-28 border-t border-[#303030] bg-[#080808]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#D3B5FF]">
            <EditorialStar className="w-3.5 h-3.5 text-[#B56AFF] shrink-0" />
            <span>04 · Professional Journey</span>
          </div>
          <h2
            className="mt-3 font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#D8F0E7] leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            Experience &amp; Professional Growth.
          </h2>
        </motion.div>

        {/* Vertical Editorial Timeline */}
        <div className="mt-14 relative">
          {/* Thin Purple Connecting Line */}
          <div
            className="hidden sm:block absolute left-5 top-3 bottom-3 w-px bg-gradient-to-b from-[#B56AFF]/80 via-[#873BFF]/45 to-transparent"
            aria-hidden="true"
          />

          <div className="space-y-8">
            {portfolio.experiences.map((exp, idx) => (
              <motion.article
                key={exp.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: 0.4,
                  delay: idx * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative sm:pl-14"
              >
                {/* Minimal Timeline Indicator */}
                <div
                  className="hidden sm:flex absolute left-0 top-6 w-10 h-10 rounded-full bg-[#141414] border border-[#B56AFF]/55 items-center justify-center font-mono text-xs font-semibold text-[#D3B5FF] tabular-nums shadow-[0_0_16px_rgba(135,59,255,0.2)]"
                  aria-hidden="true"
                >
                  {exp.indexLabel}
                </div>

                <div className="rounded-2xl border border-[#303030] bg-[#141414]/85 backdrop-blur-sm p-6 sm:p-8 hover:border-[#B56AFF]/55 hover:shadow-[0_0_28px_rgba(135,59,255,0.1)] transition-all duration-200">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div className="flex items-start gap-3.5">
                      {exp.companyLogoUrl && (
                        <img
                          src={exp.companyLogoUrl}
                          alt={exp.companyName}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-xl border border-[#303030] bg-[#101010] object-contain p-1 shrink-0"
                        />
                      )}
                      <div>
                        <span className="sm:hidden font-mono text-xs text-[#B56AFF] tabular-nums">
                          Experience {exp.indexLabel}
                        </span>
                        <h3 className="font-display text-2xl font-semibold text-[#E9E9E9]">
                          {exp.jobTitle}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-[#D3B5FF]">
                          <span className="inline-flex items-center gap-2">
                            <Briefcase className="w-4 h-4 shrink-0 text-[#B56AFF]" />
                            <span>{exp.companyName}</span>
                          </span>
                          {exp.employmentType && (
                            <span className="font-mono text-xs text-[#858585]">
                              · {exp.employmentType}
                            </span>
                          )}
                          {exp.location && (
                            <span className="inline-flex items-center gap-1 font-mono text-xs text-[#858585]">
                              · <MapPin className="w-3 h-3 text-[#B56AFF]" /> {exp.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {(exp.periodLabel || exp.isCurrent) && (
                      <div className="inline-flex items-center gap-1.5 font-mono text-xs text-[#858585] shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-[#B56AFF]" />
                        <span>
                          {exp.periodLabel ||
                            [exp.startDate, exp.isCurrent ? 'Present' : exp.endDate]
                              .filter(Boolean)
                              .join(' – ')}
                        </span>
                      </div>
                    )}
                  </div>

                  <ul className="mt-5 pt-5 border-t border-[#303030] space-y-2.5">
                    {exp.responsibilities.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm leading-relaxed text-[#BDBDBD]"
                      >
                        <span
                          className="mt-2 h-1.5 w-1.5 rounded-full bg-[#B56AFF] shrink-0"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  {exp.technologies.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-[#303030]/60">
                      <p className="font-mono text-xs text-[#858585]">
                        {exp.technologies.join(' · ')}
                      </p>
                    </div>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
