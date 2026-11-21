import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { BadgeCheck, ExternalLink, FileText } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { trackEvent } from '../lib/analytics';
import { EditorialStar } from './TechIcons';

export const CertificationsSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const { portfolio } = usePortfolio();

  return (
    <section
      id="certifications"
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
            <span>07 · Certifications</span>
          </div>
          <h2
            className="mt-3 font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#D8F0E7] leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            Learning. Building. Growing.
          </h2>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {portfolio.certifications.map((cert, idx) => (
            <motion.article
              key={cert.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                duration: 0.35,
                delay: idx * 0.04,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group rounded-2xl border border-[#303030] bg-[#141414] p-6 hover:border-[#B56AFF]/60 hover:bg-[#191919] hover:shadow-[0_0_24px_rgba(135,59,255,0.12)] transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#191919] border border-[#303030] text-[#D3B5FF] group-hover:text-[#B56AFF] transition-colors">
                    <BadgeCheck className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs text-[#858585] tabular-nums">
                    {cert.indexLabel}
                  </span>
                </div>

                {cert.certificateImageUrl && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-[#303030] bg-[#080808] aspect-[16/10]">
                    <img
                      src={cert.certificateImageUrl}
                      alt={cert.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <h3 className="mt-5 font-display text-xl font-semibold text-[#E9E9E9] group-hover:text-[#D8F0E7] transition-colors">
                  {cert.title}
                </h3>
                <p className="mt-2 text-sm text-[#BDBDBD]">{cert.issuer}</p>

                {(cert.issueDate || cert.credentialId) && (
                  <p className="mt-2 font-mono text-[11px] text-[#858585]">
                    {[cert.issueDate, cert.credentialId ? `ID: ${cert.credentialId}` : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              </div>

              {(cert.verificationUrl || cert.certificatePdfAssetId) && (
                <div className="mt-5 pt-4 border-t border-[#303030] flex flex-wrap items-center gap-3">
                  {cert.verificationUrl && (
                    <a
                      href={cert.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackEvent('external_link_click', {
                          source: 'certifications',
                          section: 'certifications',
                          destination: 'certificate_verification',
                          metadata: { certification: cert.title },
                        })
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D3B5FF] hover:text-[#D8F0E7] transition-colors"
                    >
                      <span>Verify Credential</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {cert.certificatePdfAssetId && (
                    <a
                      href={`/api/media/${cert.certificatePdfAssetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#BDBDBD] hover:text-[#D8F0E7] transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#B56AFF]" />
                      <span>View PDF</span>
                    </a>
                  )}
                </div>
              )}
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
