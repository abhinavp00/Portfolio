import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Save, Trash2, Upload } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import type { ContactInfoData, PortfolioProfileData } from '../../types/portfolio';
import {
  AdminCard,
  AdminPageHeader,
  AdminSkeleton,
  AdminToast,
  inputClass,
  labelClass,
  type AdminToastState,
} from './AdminShared';

export const ProfileManager: React.FC = () => {
  const { adminFetch } = useAdminAuth();
  const [profile, setProfile] = useState<PortfolioProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [toast, setToast] = useState<AdminToastState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/profile');
      if (res.ok) setProfile(await res.json());
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const handleImageUpload = async (file: File | undefined) => {
    if (!file || !profile) return;
    setUploadingImg(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('assetType', 'profile');
      const res = await adminFetch('/api/admin/media/upload', { method: 'POST', body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Image upload failed.');
      setProfile({ ...profile, profileImageUrl: body.url });
      setToast({ type: 'success', message: 'Profile image uploaded. Save changes to publish.' });
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Upload failed.',
      });
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error('Failed to save profile.');
      setProfile(await res.json());
      setToast({ type: 'success', message: 'Profile & About changes published to live portfolio.' });
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Save failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Profile & About Management"
        subtitle="Update your hero headline, portrait, availability status, biography paragraphs, and highlights."
      />

      {loading || !profile ? (
        <AdminSkeleton rows={6} />
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <AdminCard className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-[#F8FAFC]">Hero &amp; Identity</h2>
              <label className="inline-flex items-center gap-2 text-xs text-[#F8FAFC] cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.isPublished}
                  onChange={(e) => setProfile({ ...profile, isPublished: e.target.checked })}
                  className="accent-[#3B82F6]"
                />
                <span>Published on Public Portfolio</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Primary Job Title / Role</label>
                <input
                  type="text"
                  value={profile.jobTitle}
                  onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Secondary Positioning Subtitle</label>
                <input
                  type="text"
                  value={profile.secondaryJobTitle}
                  onChange={(e) => setProfile({ ...profile, secondaryJobTitle: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Location</label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Greeting Line</label>
                <input
                  type="text"
                  value={profile.greeting}
                  onChange={(e) => setProfile({ ...profile, greeting: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Availability Label</label>
                <input
                  type="text"
                  value={profile.availabilityLabel}
                  onChange={(e) => setProfile({ ...profile, availabilityLabel: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Profile Image URL or Upload</label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={profile.profileImageUrl}
                  onChange={(e) => setProfile({ ...profile, profileImageUrl: e.target.value })}
                  className={`${inputClass} flex-1 min-w-[240px]`}
                />
                <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-[#172033] hover:border-[#3B82F6] px-4 py-2.5 text-xs font-medium text-[#F8FAFC] cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>{uploadingImg ? 'Uploading...' : 'Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImg}
                    onChange={(e) => {
                      handleImageUpload(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className={labelClass}>Hero Description</label>
              <textarea
                rows={3}
                value={profile.heroDescription}
                onChange={(e) => setProfile({ ...profile, heroDescription: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Hero Highlights (one per line)</label>
                <textarea
                  rows={3}
                  value={profile.heroHighlights.join('\n')}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      heroHighlights: e.target.value.split('\n').filter((x) => x.trim() !== ''),
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Core Disciplines / Focus Areas (one per line)</label>
                <textarea
                  rows={3}
                  value={profile.focusAreas.join('\n')}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      focusAreas: e.target.value.split('\n').filter((x) => x.trim() !== ''),
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#F8FAFC] pb-3 border-b border-slate-800">
              About Section Content
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>About Section Label</label>
                <input
                  type="text"
                  value={profile.aboutSectionLabel}
                  onChange={(e) => setProfile({ ...profile, aboutSectionLabel: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>About Heading</label>
                <input
                  type="text"
                  value={profile.aboutHeading}
                  onChange={(e) => setProfile({ ...profile, aboutHeading: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>About Paragraphs (separate paragraphs by blank line)</label>
              <textarea
                rows={6}
                value={profile.aboutParagraphs.join('\n\n')}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    aboutParagraphs: e.target.value
                      .split(/\n\s*\n/)
                      .map((p) => p.trim())
                      .filter(Boolean),
                  })
                }
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Professional Summary (Optional)</label>
                <textarea
                  rows={2}
                  value={profile.professionalSummary}
                  onChange={(e) => setProfile({ ...profile, professionalSummary: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Career Objective (Optional)</label>
                <textarea
                  rows={2}
                  value={profile.careerObjective}
                  onChange={(e) => setProfile({ ...profile, careerObjective: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Highlights List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass}>About Focus Cards</label>
                <button
                  type="button"
                  onClick={() =>
                    setProfile({
                      ...profile,
                      professionalHighlights: [
                        ...profile.professionalHighlights,
                        {
                          index: String(profile.professionalHighlights.length + 1).padStart(2, '0'),
                          title: '',
                          detail: '',
                        },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1 text-xs text-[#3B82F6] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Card
                </button>
              </div>
              <div className="space-y-2">
                {profile.professionalHighlights.map((h, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={h.index}
                      onChange={(e) => {
                        const next = [...profile.professionalHighlights];
                        next[idx] = { ...h, index: e.target.value };
                        setProfile({ ...profile, professionalHighlights: next });
                      }}
                      placeholder="01"
                      className={`${inputClass} col-span-2`}
                    />
                    <input
                      type="text"
                      value={h.title}
                      onChange={(e) => {
                        const next = [...profile.professionalHighlights];
                        next[idx] = { ...h, title: e.target.value };
                        setProfile({ ...profile, professionalHighlights: next });
                      }}
                      placeholder="Title"
                      className={`${inputClass} col-span-4`}
                    />
                    <input
                      type="text"
                      value={h.detail}
                      onChange={(e) => {
                        const next = [...profile.professionalHighlights];
                        next[idx] = { ...h, detail: e.target.value };
                        setProfile({ ...profile, professionalHighlights: next });
                      }}
                      placeholder="Detail"
                      className={`${inputClass} col-span-5`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setProfile({
                          ...profile,
                          professionalHighlights: profile.professionalHighlights.filter(
                            (_, i) => i !== idx
                          ),
                        })
                      }
                      className="col-span-1 p-2 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </AdminCard>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:brightness-110 px-6 py-2.5 text-xs font-semibold text-white"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save & Publish Profile'}</span>
            </button>
          </div>
        </form>
      )}

      <AdminToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export const ContactManager: React.FC = () => {
  const { adminFetch } = useAdminAuth();
  const [contact, setContact] = useState<ContactInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<AdminToastState | null>(null);

  useEffect(() => {
    adminFetch('/api/admin/contact')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setContact(data))
      .finally(() => setLoading(false));
  }, [adminFetch]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;
    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/contact', {
        method: 'PUT',
        body: JSON.stringify(contact),
      });
      if (!res.ok) throw new Error('Failed to update contact details.');
      setContact(await res.json());
      setToast({
        type: 'success',
        message: 'Contact information updated across Hero, Contact section, and Footer.',
      });
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Save failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Contact Information Manager"
        subtitle="Manage your verified email, phone number, LinkedIn, GitHub, and optional WhatsApp link across the public site."
      />

      {loading || !contact ? (
        <AdminSkeleton rows={5} />
      ) : (
        <AdminCard className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Professional Email</label>
                <input
                  type="email"
                  required
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone / Contact Number</label>
                <input
                  type="text"
                  required
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>LinkedIn Profile URL</label>
                <input
                  type="url"
                  required
                  value={contact.linkedinUrl}
                  onChange={(e) => setContact({ ...contact, linkedinUrl: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>GitHub Profile URL</label>
                <input
                  type="url"
                  required
                  value={contact.githubUrl}
                  onChange={(e) => setContact({ ...contact, githubUrl: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Location</label>
                <input
                  type="text"
                  value={contact.location}
                  onChange={(e) => setContact({ ...contact, location: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>WhatsApp Number (Optional)</label>
                <input
                  type="text"
                  value={contact.whatsappNumber}
                  onChange={(e) => setContact({ ...contact, whatsappNumber: e.target.value })}
                  placeholder="+91 7994826817"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Contact Section Heading</label>
              <input
                type="text"
                value={contact.contactHeading}
                onChange={(e) => setContact({ ...contact, contactHeading: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Contact Section Description</label>
              <textarea
                rows={3}
                value={contact.contactDescription}
                onChange={(e) => setContact({ ...contact, contactDescription: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="inline-flex items-center gap-2 text-xs text-[#F8FAFC] cursor-pointer">
                <input
                  type="checkbox"
                  checked={contact.whatsappEnabled}
                  onChange={(e) => setContact({ ...contact, whatsappEnabled: e.target.checked })}
                  className="accent-[#3B82F6]"
                />
                <span>Display WhatsApp Contact Card</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs text-[#F8FAFC] cursor-pointer">
                <input
                  type="checkbox"
                  checked={contact.isPublished}
                  onChange={(e) => setContact({ ...contact, isPublished: e.target.checked })}
                  className="accent-[#3B82F6]"
                />
                <span>Contact Section Published</span>
              </label>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] px-6 py-2.5 text-xs font-semibold text-white"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Contact Information'}</span>
              </button>
            </div>
          </form>
        </AdminCard>
      )}

      <AdminToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
