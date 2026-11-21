import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Github,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { getCampaignParams, trackEvent } from '../lib/analytics';
import { ENQUIRY_CATEGORIES } from '../types/portfolio';
import { EditorialStar } from './TechIcons';

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  category: string;
  subject: string;
  message: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export const ContactSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const { portfolio } = usePortfolio();
  const { contact, settings } = portfolio;

  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    phone: '',
    category: ENQUIRY_CATEGORIES[0],
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [lastEnquiryCode, setLastEnquiryCode] = useState<string | null>(null);
  const startedRef = useRef(false);

  const handleFormStart = () => {
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent('contact_form_start', {
        source: 'contact_form',
        section: 'contact',
      });
    }
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      nextErrors.fullName = 'Please enter your full name (at least 2 characters).';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!form.subject.trim() || form.subject.trim().length < 3) {
      nextErrors.subject = 'Please enter a subject for your inquiry.';
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      nextErrors.message = 'Please enter a message of at least 10 characters.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('submitting');
    setFeedbackMessage('');
    setLastEnquiryCode(null);

    trackEvent('contact_form_submit', {
      source: 'contact_form',
      section: 'contact',
      metadata: { category: form.category },
    });

    try {
      const campaignParams = getCampaignParams();
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          category: form.category,
          subject: form.subject.trim(),
          message: form.message.trim(),
          sourcePage: window.location.pathname || '/',
          referrer: document.referrer || '',
          campaignSource: campaignParams.utm_source || '',
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Submission request failed. Please try again.');
      }

      setStatus('success');
      setLastEnquiryCode(data.enquiryCode || null);
      setFeedbackMessage(
        data.enquiryCode
          ? `Thank you! Your enquiry (${data.enquiryCode}) has been received and saved.`
          : 'Thank you! Your enquiry has been received successfully.'
      );
      setForm({
        fullName: '',
        email: '',
        phone: '',
        category: ENQUIRY_CATEGORIES[0],
        subject: '',
        message: '',
      });
      startedRef.current = false;

      trackEvent('contact_form_success', {
        source: 'contact_form',
        section: 'contact',
        metadata: { category: form.category, enquiryCode: data.enquiryCode || '' },
      });
    } catch (err) {
      setStatus('error');
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Unable to send your message right now. Please try again.';
      setFeedbackMessage(errMsg);
      trackEvent('contact_form_error', {
        source: 'contact_form',
        section: 'contact',
      });
    }
  };

  const normalizedPhoneHref = contact.phone
    ? `tel:${contact.phone.replace(/[^+\d]/g, '')}`
    : '';
  const whatsappClean = contact.whatsappNumber
    ? contact.whatsappNumber.replace(/[^\d]/g, '')
    : '';
  const showWhatsapp = Boolean(
    (contact.whatsappEnabled || settings.whatsappEnabled) && whatsappClean
  );

  const githubDisplay = contact.githubUrl
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/$/, '');

  return (
    <section id="contact" className="relative py-20 sm:py-28 border-t border-[#303030] bg-[#080808]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#D3B5FF]">
            <EditorialStar className="w-3.5 h-3.5 text-[#B56AFF] shrink-0" />
            <span>08 · Get In Touch</span>
          </div>
          <h2
            className="mt-3 font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#D8F0E7] leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            {contact.contactHeading}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#BDBDBD]">
            {contact.contactDescription}
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Contact Details Column */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-4"
          >
            {/* Prominent LinkedIn Card */}
            <div className="rounded-2xl border border-[#303030] bg-[#141414] p-6 hover:border-[#B56AFF]/60 hover:shadow-[0_0_28px_rgba(135,59,255,0.14)] transition-all duration-200">
              <div className="flex items-start gap-4">
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent('linkedin_click', {
                      source: 'contact_icon',
                      section: 'contact',
                      destination: 'linkedin',
                    })
                  }
                  aria-label="Open LinkedIn Profile"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#191919] border border-[#303030] text-[#B56AFF] hover:text-[#D8F0E7] hover:border-[#B56AFF] shrink-0 transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs uppercase tracking-wider text-[#858585]">
                    LINKEDIN
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#BDBDBD]">
                    Connect professionally and explore my work.
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent('linkedin_click', {
                      source: 'contact_button',
                      section: 'contact',
                      destination: 'linkedin',
                    })
                  }
                  className="font-nav inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#191919] hover:bg-gradient-to-r hover:from-[#873BFF] hover:to-[#B56AFF] border border-[#303030] hover:border-transparent text-xs font-medium text-[#D8F0E7] hover:text-[#F8FAFC] transition-all"
                >
                  <span>View LinkedIn Profile</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Prominent Email Card */}
            <div className="rounded-2xl border border-[#303030] bg-[#141414] p-6 hover:border-[#B56AFF]/60 hover:shadow-[0_0_28px_rgba(135,59,255,0.14)] transition-all duration-200">
              <div className="flex items-start gap-4">
                <a
                  href={`mailto:${contact.email}`}
                  onClick={() =>
                    trackEvent('email_click', {
                      source: 'contact_icon',
                      section: 'contact',
                      destination: 'email',
                    })
                  }
                  aria-label="Send Email to Abhinav P"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#191919] border border-[#303030] text-[#D3B5FF] hover:text-[#D8F0E7] hover:border-[#B56AFF] shrink-0 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                </a>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs uppercase tracking-wider text-[#858585]">
                    EMAIL
                  </p>
                  <a
                    href={`mailto:${contact.email}`}
                    onClick={() =>
                      trackEvent('email_click', {
                        source: 'contact_address',
                        section: 'contact',
                        destination: 'email',
                      })
                    }
                    className="mt-1 block text-sm font-medium text-[#D8F0E7] hover:text-[#D3B5FF] transition-colors break-all"
                  >
                    {contact.email}
                  </a>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#BDBDBD]">
                    Have an opportunity or project in mind? Let&apos;s connect.
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <a
                  href={`mailto:${contact.email}`}
                  onClick={() =>
                    trackEvent('email_click', {
                      source: 'contact_button',
                      section: 'contact',
                      destination: 'email',
                    })
                  }
                  className="font-nav inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-full bg-gradient-to-r from-[#873BFF] to-[#B56AFF] hover:brightness-110 text-xs font-medium text-[#F8FAFC] shadow-[0_0_20px_rgba(135,59,255,0.28)] transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Me an Email</span>
                </a>
              </div>
            </div>

            {/* Prominent Contact Number Card */}
            {contact.phone && (
              <div className="rounded-2xl border border-[#303030] bg-[#141414] p-6 shadow-[0_0_24px_rgba(135,59,255,0.06)] hover:border-[#B56AFF]/60 hover:shadow-[0_0_28px_rgba(135,59,255,0.16)] transition-all duration-200">
                <div className="flex items-start gap-4">
                  <a
                    href={normalizedPhoneHref}
                    onClick={() =>
                      trackEvent('phone_click', {
                        source: 'contact_icon',
                        section: 'contact',
                        destination: 'phone',
                      })
                    }
                    aria-label="Call Abhinav P"
                    className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#191919] border border-[#303030] text-[#B56AFF] hover:text-[#D8F0E7] hover:border-[#B56AFF] shrink-0 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs uppercase tracking-wider text-[#858585]">
                      Phone / Contact Number
                    </p>
                    <a
                      href={normalizedPhoneHref}
                      onClick={() =>
                        trackEvent('phone_click', {
                          source: 'contact_number',
                          section: 'contact',
                          destination: 'phone',
                        })
                      }
                      className="mt-1 inline-block text-base font-medium tracking-wide text-[#D8F0E7] hover:text-[#B56AFF] transition-colors"
                    >
                      {contact.phone}
                    </a>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#BDBDBD]">
                      Available for calls regarding projects and engineering roles.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  <a
                    href={normalizedPhoneHref}
                    onClick={() =>
                      trackEvent('phone_click', {
                        source: 'contact_button',
                        section: 'contact',
                        destination: 'phone',
                      })
                    }
                    className="group font-nav inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#191919] hover:bg-gradient-to-r hover:from-[#873BFF] hover:to-[#B56AFF] border border-[#303030] hover:border-transparent text-xs font-medium text-[#D8F0E7] hover:text-[#F8FAFC] transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#B56AFF] group-hover:text-[#F8FAFC] transition-colors" />
                    <span>Call Now</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>

                  {showWhatsapp && (
                    <a
                      href={`https://wa.me/${whatsappClean}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackEvent('whatsapp_click', {
                          source: 'contact_button',
                          section: 'contact',
                          destination: 'whatsapp',
                        })
                      }
                      className="font-nav inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#191919] hover:border-[#B56AFF] border border-[#303030] text-xs font-medium text-[#D8F0E7] transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#B56AFF]" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Location & GitHub */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#303030] bg-[#141414] p-4 flex items-center gap-3">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#191919] border border-[#303030] text-[#D3B5FF] shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-[#858585]">
                    Location
                  </p>
                  <p className="text-xs font-medium text-[#E9E9E9] truncate">
                    {contact.location}
                  </p>
                </div>
              </div>

              <a
                href={contact.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent('github_click', {
                    source: 'contact',
                    section: 'contact',
                    destination: 'github',
                  })
                }
                className="group rounded-2xl border border-[#303030] bg-[#141414] p-4 flex items-center gap-3 hover:border-[#B56AFF]/60 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#191919] border border-[#303030] text-[#E9E9E9] group-hover:text-[#B56AFF] shrink-0 transition-colors">
                  <Github className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-[#858585]">
                    GitHub
                  </p>
                  <p className="text-xs font-medium text-[#E9E9E9] group-hover:text-[#D3B5FF] transition-colors truncate">
                    {githubDisplay}
                  </p>
                </div>
              </a>
            </div>
          </motion.div>

          {/* Contact Form Column */}
          <motion.form
            onSubmit={handleSubmit}
            noValidate
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.4, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 rounded-2xl border border-[#303030] bg-[#141414] p-6 sm:p-8 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="contact-fullName"
                  className="block text-xs font-mono uppercase tracking-wider text-[#BDBDBD] mb-2"
                >
                  Full Name
                </label>
                <input
                  id="contact-fullName"
                  type="text"
                  value={form.fullName}
                  onFocus={handleFormStart}
                  onChange={(e) => {
                    handleFormStart();
                    setForm((prev) => ({ ...prev, fullName: e.target.value }));
                    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                  }}
                  placeholder="Your full name"
                  aria-invalid={Boolean(errors.fullName)}
                  className={`w-full rounded-xl border bg-[#101010] px-4 py-3 text-sm text-[#E9E9E9] placeholder:text-[#858585] focus:outline-none focus:ring-2 transition-colors ${
                    errors.fullName
                      ? 'border-rose-500/70 focus:ring-rose-500/40'
                      : 'border-[#303030] focus:border-[#B56AFF] focus:ring-[#873BFF]/30'
                  }`}
                />
                {errors.fullName && (
                  <p className="mt-1.5 text-xs text-rose-400">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-xs font-mono uppercase tracking-wider text-[#BDBDBD] mb-2"
                >
                  Email Address
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onFocus={handleFormStart}
                  onChange={(e) => {
                    handleFormStart();
                    setForm((prev) => ({ ...prev, email: e.target.value }));
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  className={`w-full rounded-xl border bg-[#101010] px-4 py-3 text-sm text-[#E9E9E9] placeholder:text-[#858585] focus:outline-none focus:ring-2 transition-colors ${
                    errors.email
                      ? 'border-rose-500/70 focus:ring-rose-500/40'
                      : 'border-[#303030] focus:border-[#B56AFF] focus:ring-[#873BFF]/30'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-rose-400">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="contact-phone"
                  className="block text-xs font-mono uppercase tracking-wider text-[#BDBDBD] mb-2"
                >
                  Contact Number <span className="text-[#858585] normal-case">(Optional)</span>
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={form.phone}
                  onFocus={handleFormStart}
                  onChange={(e) => {
                    handleFormStart();
                    setForm((prev) => ({ ...prev, phone: e.target.value }));
                  }}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-[#303030] bg-[#101010] px-4 py-3 text-sm text-[#E9E9E9] placeholder:text-[#858585] focus:outline-none focus:border-[#B56AFF] focus:ring-2 focus:ring-[#873BFF]/30 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-category"
                  className="block text-xs font-mono uppercase tracking-wider text-[#BDBDBD] mb-2"
                >
                  Enquiry Category
                </label>
                <select
                  id="contact-category"
                  value={form.category}
                  onFocus={handleFormStart}
                  onChange={(e) => {
                    handleFormStart();
                    setForm((prev) => ({ ...prev, category: e.target.value }));
                  }}
                  className="w-full rounded-xl border border-[#303030] bg-[#101010] px-4 py-3 text-sm text-[#E9E9E9] focus:outline-none focus:border-[#B56AFF] focus:ring-2 focus:ring-[#873BFF]/30 transition-colors"
                >
                  {ENQUIRY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#141414] text-[#E9E9E9]">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="contact-subject"
                className="block text-xs font-mono uppercase tracking-wider text-[#BDBDBD] mb-2"
              >
                Subject
              </label>
              <input
                id="contact-subject"
                type="text"
                value={form.subject}
                onFocus={handleFormStart}
                onChange={(e) => {
                  handleFormStart();
                  setForm((prev) => ({ ...prev, subject: e.target.value }));
                  if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
                }}
                placeholder="Project collaboration, backend role, or data analytics inquiry"
                aria-invalid={Boolean(errors.subject)}
                className={`w-full rounded-xl border bg-[#101010] px-4 py-3 text-sm text-[#E9E9E9] placeholder:text-[#858585] focus:outline-none focus:ring-2 transition-colors ${
                  errors.subject
                    ? 'border-rose-500/70 focus:ring-rose-500/40'
                    : 'border-[#303030] focus:border-[#B56AFF] focus:ring-[#873BFF]/30'
                }`}
              />
              {errors.subject && (
                <p className="mt-1.5 text-xs text-rose-400">{errors.subject}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="block text-xs font-mono uppercase tracking-wider text-[#BDBDBD] mb-2"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                rows={5}
                value={form.message}
                onFocus={handleFormStart}
                onChange={(e) => {
                  handleFormStart();
                  setForm((prev) => ({ ...prev, message: e.target.value }));
                  if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
                }}
                placeholder="Share details about your project, timeline, or opportunity..."
                aria-invalid={Boolean(errors.message)}
                className={`w-full rounded-xl border bg-[#101010] px-4 py-3 text-sm text-[#E9E9E9] placeholder:text-[#858585] focus:outline-none focus:ring-2 transition-colors resize-y ${
                  errors.message
                    ? 'border-rose-500/70 focus:ring-rose-500/40'
                    : 'border-[#303030] focus:border-[#B56AFF] focus:ring-[#873BFF]/30'
                }`}
              />
              {errors.message && (
                <p className="mt-1.5 text-xs text-rose-400">{errors.message}</p>
              )}
            </div>

            {/* Status Notification */}
            {status === 'success' && (
              <div
                role="status"
                className="rounded-xl border border-[#B56AFF]/40 bg-[#873BFF]/10 p-4 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#D8F0E7]">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#B56AFF]" />
                  <div>
                    <span>{feedbackMessage}</span>
                    {lastEnquiryCode && (
                      <p className="mt-1 font-mono text-[11px] text-[#D3B5FF]">
                        Reference ID: {lastEnquiryCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-start gap-2.5 text-xs sm:text-sm text-rose-300"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{feedbackMessage}</span>
              </div>
            )}

            <div className="pt-1 flex items-center justify-end">
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="font-nav inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-[#873BFF] to-[#B56AFF] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium text-[#F8FAFC] shadow-[0_0_24px_rgba(135,59,255,0.3)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D3B5FF]"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </section>
  );
};
