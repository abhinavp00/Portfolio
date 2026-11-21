export interface PortfolioProfileData {
  id: number;
  fullName: string;
  jobTitle: string;
  secondaryJobTitle: string;
  profileImageUrl: string;
  location: string;
  availabilityLabel: string;
  availabilityStatus: string;
  greeting: string;
  heroHeading: string;
  heroDescription: string;
  heroHighlights: string[];
  focusAreas: string[];
  aboutSectionLabel: string;
  aboutHeading: string;
  aboutDescription: string;
  aboutParagraphs: string[];
  professionalSummary: string;
  careerObjective: string;
  professionalHighlights: { index: string; title: string; detail: string }[];
  personalInfo: { label: string; value: string }[];
  isPublished: boolean;
  updatedAt?: string;
}

export interface ExperienceData {
  id: number;
  slug: string;
  indexLabel: string;
  companyName: string;
  jobTitle: string;
  location: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  periodLabel: string;
  isCurrent: boolean;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  companyLogoUrl: string;
  displayOrder: number;
  isPublished: boolean;
}

export interface ProjectData {
  id: number;
  slug: string;
  numberLabel: string;
  title: string;
  fullTitle: string;
  category: string;
  completed: string;
  description: string;
  stack: string[];
  githubUrl: string;
  liveDemoUrl: string;
  imageUrl: string;
  imageAlt: string;
  screenshots: string[];
  contributions: string[];
  achievements: string[];
  previewType: 'ml' | 'assetsphere' | 'rentacar' | 'standard' | string;
  isFeatured: boolean;
  isPublished: boolean;
  displayOrder: number;
}

export interface SkillItemData {
  id: number;
  categoryId: number;
  name: string;
  iconUrl: string;
  proficiency: string;
  isEnabled: boolean;
  displayOrder: number;
}

export interface SkillCategoryData {
  id: number;
  slug: string;
  title: string;
  description: string;
  iconKey: string;
  displayOrder: number;
  isPublished: boolean;
  skills: SkillItemData[];
}

export interface ServiceData {
  id: number;
  numberLabel: string;
  title: string;
  description: string;
  iconName: string;
  technologies: string[];
  displayOrder: number;
  isPublished: boolean;
}

export interface EducationData {
  id: number;
  qualification: string;
  institution: string;
  university: string;
  performance: string;
  startDate: string;
  completionDate: string;
  periodLabel: string;
  displayOrder: number;
  isPublished: boolean;
}

export interface CertificationData {
  id: number;
  indexLabel: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialId: string;
  verificationUrl: string;
  certificatePdfAssetId: number | null;
  certificatePdfName: string;
  certificateImageAssetId: number | null;
  certificateImageUrl: string;
  displayOrder: number;
  isPublished: boolean;
}

export interface ContactInfoData {
  id: number;
  email: string;
  phone: string;
  whatsappNumber: string;
  whatsappEnabled: boolean;
  linkedinUrl: string;
  githubUrl: string;
  location: string;
  contactHeading: string;
  contactDescription: string;
  isPublished: boolean;
}

export interface PortfolioSettingsData {
  id: number;
  siteTitle: string;
  footerCopyright: string;
  enableAnalytics: boolean;
  requireCookieConsent: boolean;
  dataRetentionDays: number;
  whatsappEnabled: boolean;
  maintenanceMode: boolean;
  sectionOrder: string[];
}

export type ResumeFormat = 'PDF' | 'DOCX' | 'DOC' | 'TXT' | 'RTF' | 'ODT';

export interface ResumeSummaryData {
  id: number;
  versionNumber: number;
  fileName: string;
  fileFormat?: ResumeFormat | string;
  mimeType: string;
  fileSizeBytes: number;
  sha256Hash: string;
  isActive: boolean;
  uploadedByEmail: string;
  createdAt: string;
  updatedAt: string;
  downloadCount?: number;
  hasTextPreview?: boolean;
  hasHtmlPreview?: boolean;
  extractedTextSnippet?: string;
}

export interface ResumePreviewData {
  id: number;
  versionNumber: number;
  fileName: string;
  fileFormat: ResumeFormat | string;
  mimeType: string;
  fileSizeBytes: number;
  previewType: 'pdf' | 'html' | 'text';
  previewHtml: string;
  extractedText: string;
}

export interface PublicPortfolioBundle {
  profile: PortfolioProfileData;
  experiences: ExperienceData[];
  projects: ProjectData[];
  skillCategories: SkillCategoryData[];
  services: ServiceData[];
  education: EducationData[];
  certifications: CertificationData[];
  contact: ContactInfoData;
  settings: PortfolioSettingsData;
  activeResume: ResumeSummaryData | null;
}

export type EnquiryStatus =
  | 'new'
  | 'unread'
  | 'read'
  | 'in_progress'
  | 'replied'
  | 'important'
  | 'archived';

export const ENQUIRY_CATEGORIES = [
  'Job Opportunity',
  'Internship Opportunity',
  'Freelance Project',
  'Website Development',
  'Data Analytics',
  'Collaboration',
  'General Enquiry',
  'Other',
] as const;

export interface EnquiryNoteData {
  id: number;
  enquiryId: number;
  authorEmail: string;
  note: string;
  createdAt: string;
}

export interface EnquiryStatusHistoryData {
  id: number;
  enquiryId: number;
  previousStatus: string | null;
  newStatus: string;
  changedByEmail: string;
  createdAt: string;
}

export interface EnquiryData {
  id: number;
  enquiryCode: string;
  fullName: string;
  email: string;
  phone: string;
  category: string;
  subject: string;
  message: string;
  status: EnquiryStatus;
  isImportant: boolean;
  sourcePage: string;
  referrer: string;
  campaignSource: string;
  deviceCategory: string;
  createdAt: string;
  updatedAt: string;
  notes?: EnquiryNoteData[];
  statusHistory?: EnquiryStatusHistoryData[];
}

export type AnalyticsEventName =
  | 'page_view'
  | 'session_start'
  | 'section_view'
  | 'project_view'
  | 'project_detail_view'
  | 'github_click'
  | 'linkedin_click'
  | 'email_click'
  | 'phone_click'
  | 'whatsapp_click'
  | 'resume_download_attempt'
  | 'resume_download_success'
  | 'contact_form_start'
  | 'contact_form_submit'
  | 'contact_form_success'
  | 'contact_form_error'
  | 'external_link_click';

export interface ActivityEventRecord {
  id: number;
  eventId: string;
  visitorId: string;
  sessionId: string;
  eventName: AnalyticsEventName | string;
  pagePath: string;
  sectionName: string;
  sourceLabel: string;
  targetCategory: string;
  projectId: string;
  projectTitle: string;
  deviceCategory: string;
  referrer: string;
  createdAt: string;
}
