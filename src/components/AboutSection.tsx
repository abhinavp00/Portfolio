import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';
import { EditorialStar } from './TechIcons';

export const AboutSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const { portfolio } = usePortfolio();
  const { profile } = portfolio;

  const paragraphs =
    profile.aboutParagraphs.length > 0
      ? profile.aboutParagraphs
      : [profile.aboutDescription].filter(Boolean);

  return (
    <section
      id="about"
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
            <span>{profile.aboutSectionLabel}</span>
          </div>
          <h2
            className="mt-3 font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#D8F0E7] max-w-4xl leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            {profile.aboutHeading}
          </h2>
        </motion.div>

        {/* Summary & Personal Info Panel */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-5 text-[#BDBDBD] text-base leading-relaxed"
          >
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </motion.div>

          {/* Personal Information Panel */}
          <motion.aside
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 rounded-2xl border border-[#303030] bg-[#141414] p-6 sm:p-7"
            aria-label="Personal Information"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-[#D8F0E7]">
                Profile Summary
              </h3>
              <EditorialStar className="w-4 h-4 text-[#B56AFF]" />
            </div>
            <dl className="mt-5 divide-y divide-[#303030]">
              {profile.personalInfo.map((item) => (
                <div
                  key={item.label}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4"
                >
                  <dt className="font-mono text-xs uppercase tracking-wider text-[#858585] shrink-0">
                    {item.label}
                  </dt>
                  <dd className="text-sm font-medium text-[#E9E9E9] sm:text-right">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.aside>
        </div>

        {/* Professional Highlights Grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {profile.professionalHighlights.map((item, idx) => (
            <motion.div
              key={`${item.index}-${idx}`}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                duration: 0.35,
                delay: idx * 0.04,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group rounded-2xl border border-[#303030] bg-[#141414] p-6 hover:border-[#B56AFF]/60 hover:bg-[#191919] hover:shadow-[0_0_28px_rgba(135,59,255,0.12)] transition-all duration-200"
            >
              <span className="font-mono text-xs font-semibold text-[#B56AFF] tabular-nums">
                {item.index}
              </span>
              <h3 className="mt-2.5 font-display text-xl font-semibold text-[#E9E9E9] group-hover:text-[#D8F0E7] transition-colors">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#BDBDBD]">
                {item.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
