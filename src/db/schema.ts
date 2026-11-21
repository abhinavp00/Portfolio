import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. Admin Users
export const adminUsers = pgTable(
  'admin_users',
  {
    id: serial('id').primaryKey(),
    uid: text('uid').unique(),
    username: text('username'),
    passwordHash: text('password_hash'),
    email: text('email').notNull().unique(),
    displayName: text('display_name'),
    role: text('role').notNull().default('super_admin'),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('admin_users_username_idx').on(table.username)]
);

// 1b. Admin Sessions
export const adminSessions = pgTable(
  'admin_sessions',
  {
    id: serial('id').primaryKey(),
    tokenHash: text('token_hash').notNull().unique(),
    adminUserId: integer('admin_user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    userAgent: text('user_agent').notNull().default(''),
    expiresAt: timestamp('expires_at').notNull(),
    lastUsedAt: timestamp('last_used_at').notNull().defaultNow(),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('admin_sessions_user_idx').on(table.adminUserId),
    index('admin_sessions_expires_idx').on(table.expiresAt),
  ]
);

// 2. Portfolio Profile
export const portfolioProfile = pgTable('portfolio_profile', {
  id: serial('id').primaryKey(),
  fullName: text('full_name').notNull(),
  jobTitle: text('job_title').notNull(),
  secondaryJobTitle: text('secondary_job_title').notNull().default(''),
  profileImageUrl: text('profile_image_url').notNull(),
  location: text('location').notNull(),
  availabilityLabel: text('availability_label').notNull(),
  availabilityStatus: text('availability_status').notNull().default('available'),
  greeting: text('greeting').notNull().default("Hello, I'm"),
  heroHeading: text('hero_heading').notNull(),
  heroDescription: text('hero_description').notNull(),
  heroHighlights: jsonb('hero_highlights').$type<string[]>().notNull().default([]),
  focusAreas: jsonb('focus_areas').$type<string[]>().notNull().default([]),
  aboutSectionLabel: text('about_section_label').notNull().default('01 · About Me'),
  aboutHeading: text('about_heading').notNull(),
  aboutDescription: text('about_description').notNull(),
  aboutParagraphs: jsonb('about_paragraphs').$type<string[]>().notNull().default([]),
  professionalSummary: text('professional_summary').notNull().default(''),
  careerObjective: text('career_objective').notNull().default(''),
  professionalHighlights: jsonb('professional_highlights')
    .$type<{ index: string; title: string; detail: string }[]>()
    .notNull()
    .default([]),
  personalInfo: jsonb('personal_info')
    .$type<{ label: string; value: string }[]>()
    .notNull()
    .default([]),
  isPublished: boolean('is_published').notNull().default(true),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 3. Professional Experience
export const professionalExperience = pgTable(
  'professional_experience',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    indexLabel: text('index_label').notNull().default('01'),
    companyName: text('company_name').notNull(),
    jobTitle: text('job_title').notNull(),
    location: text('location').notNull().default(''),
    employmentType: text('employment_type').notNull().default('Internship'),
    startDate: text('start_date').notNull().default(''),
    endDate: text('end_date').notNull().default(''),
    periodLabel: text('period_label').notNull().default(''),
    isCurrent: boolean('is_current').notNull().default(false),
    responsibilities: jsonb('responsibilities').$type<string[]>().notNull().default([]),
    achievements: jsonb('achievements').$type<string[]>().notNull().default([]),
    technologies: jsonb('technologies').$type<string[]>().notNull().default([]),
    companyLogoUrl: text('company_logo_url').notNull().default(''),
    displayOrder: integer('display_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('experience_order_idx').on(table.displayOrder, table.isPublished)]
);

// 4. Projects
export const projects = pgTable(
  'projects',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    numberLabel: text('number_label').notNull().default('01'),
    title: text('title').notNull(),
    fullTitle: text('full_title').notNull(),
    category: text('category').notNull(),
    completed: text('completed').notNull().default(''),
    description: text('description').notNull(),
    stack: jsonb('stack').$type<string[]>().notNull().default([]),
    githubUrl: text('github_url').notNull().default(''),
    liveDemoUrl: text('live_demo_url').notNull().default(''),
    imageUrl: text('image_url').notNull().default(''),
    imageAlt: text('image_alt').notNull().default(''),
    screenshots: jsonb('screenshots').$type<string[]>().notNull().default([]),
    contributions: jsonb('contributions').$type<string[]>().notNull().default([]),
    achievements: jsonb('achievements').$type<string[]>().notNull().default([]),
    previewType: text('preview_type').notNull().default('standard'),
    isFeatured: boolean('is_featured').notNull().default(false),
    isPublished: boolean('is_published').notNull().default(true),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('projects_order_idx').on(table.displayOrder, table.isPublished)]
);

// 5. Skill Categories
export const skillCategories = pgTable(
  'skill_categories',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    iconKey: text('icon_key').notNull().default('analytics'),
    displayOrder: integer('display_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('skill_categories_order_idx').on(table.displayOrder)]
);

// 6. Skills
export const skills = pgTable(
  'skills',
  {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => skillCategories.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    iconUrl: text('icon_url').notNull().default(''),
    proficiency: text('proficiency').notNull().default(''),
    isEnabled: boolean('is_enabled').notNull().default(true),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('skills_category_order_idx').on(table.categoryId, table.displayOrder)]
);

export const skillCategoriesRelations = relations(skillCategories, ({ many }) => ({
  skills: many(skills),
}));

export const skillsRelations = relations(skills, ({ one }) => ({
  category: one(skillCategories, {
    fields: [skills.categoryId],
    references: [skillCategories.id],
  }),
}));

// 7. Services
export const services = pgTable(
  'services',
  {
    id: serial('id').primaryKey(),
    numberLabel: text('number_label').notNull().default('01'),
    title: text('title').notNull(),
    description: text('description').notNull(),
    iconName: text('icon_name').notNull().default('barChart'),
    technologies: jsonb('technologies').$type<string[]>().notNull().default([]),
    displayOrder: integer('display_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('services_order_idx').on(table.displayOrder)]
);

// 8. Education
export const education = pgTable(
  'education',
  {
    id: serial('id').primaryKey(),
    qualification: text('qualification').notNull(),
    institution: text('institution').notNull(),
    university: text('university').notNull().default(''),
    performance: text('performance').notNull(),
    startDate: text('start_date').notNull().default(''),
    completionDate: text('completion_date').notNull().default(''),
    periodLabel: text('period_label').notNull(),
    displayOrder: integer('display_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('education_order_idx').on(table.displayOrder)]
);

// 9. Certifications
export const certifications = pgTable(
  'certifications',
  {
    id: serial('id').primaryKey(),
    indexLabel: text('index_label').notNull().default('01'),
    title: text('title').notNull(),
    issuer: text('issuer').notNull(),
    issueDate: text('issue_date').notNull().default(''),
    credentialId: text('credential_id').notNull().default(''),
    verificationUrl: text('verification_url').notNull().default(''),
    certificatePdfAssetId: integer('certificate_pdf_asset_id'),
    certificatePdfName: text('certificate_pdf_name').notNull().default(''),
    certificateImageAssetId: integer('certificate_image_asset_id'),
    certificateImageUrl: text('certificate_image_url').notNull().default(''),
    displayOrder: integer('display_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('certifications_order_idx').on(table.displayOrder)]
);

// 10. Contact Information
export const contactInformation = pgTable('contact_information', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  phone: text('phone').notNull().default(''),
  whatsappNumber: text('whatsapp_number').notNull().default(''),
  whatsappEnabled: boolean('whatsapp_enabled').notNull().default(false),
  linkedinUrl: text('linkedin_url').notNull(),
  githubUrl: text('github_url').notNull(),
  location: text('location').notNull(),
  contactHeading: text('contact_heading').notNull(),
  contactDescription: text('contact_description').notNull(),
  isPublished: boolean('is_published').notNull().default(true),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 11. Resume Files
export const resumeFiles = pgTable(
  'resume_files',
  {
    id: serial('id').primaryKey(),
    versionNumber: integer('version_number').notNull().default(1),
    fileName: text('file_name').notNull(),
    fileFormat: text('file_format').notNull().default('PDF'),
    mimeType: text('mime_type').notNull().default('application/pdf'),
    fileSizeBytes: integer('file_size_bytes').notNull(),
    fileDataBase64: text('file_data_base64').notNull(),
    extractedText: text('extracted_text').notNull().default(''),
    previewHtml: text('preview_html').notNull().default(''),
    sha256Hash: text('sha256_hash').notNull(),
    isActive: boolean('is_active').notNull().default(false),
    uploadedByEmail: text('uploaded_by_email').notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('resume_active_idx').on(table.isActive, table.versionNumber)]
);

// 12. Portfolio Settings
export const portfolioSettings = pgTable('portfolio_settings', {
  id: serial('id').primaryKey(),
  siteTitle: text('site_title').notNull().default('Abhinav P | Data Analytics & Python Full Stack Developer'),
  footerCopyright: text('footer_copyright').notNull().default('© 2026 Abhinav P. All Rights Reserved.'),
  enableAnalytics: boolean('enable_analytics').notNull().default(true),
  requireCookieConsent: boolean('require_cookie_consent').notNull().default(true),
  dataRetentionDays: integer('data_retention_days').notNull().default(180),
  whatsappEnabled: boolean('whatsapp_enabled').notNull().default(false),
  maintenanceMode: boolean('maintenance_mode').notNull().default(false),
  sectionOrder: jsonb('section_order')
    .$type<string[]>()
    .notNull()
    .default(['hero', 'about', 'skills', 'services', 'experience', 'projects', 'education', 'certifications', 'contact']),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 13. Media Assets (Icons, Certificates, Project Screenshots, Profile Images)
export const mediaAssets = pgTable('media_assets', {
  id: serial('id').primaryKey(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSizeBytes: integer('file_size_bytes').notNull(),
  assetType: text('asset_type').notNull(),
  dataBase64: text('data_base64').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 14. Enquiries
export const enquiries = pgTable(
  'enquiries',
  {
    id: serial('id').primaryKey(),
    enquiryCode: text('enquiry_code').notNull().unique(),
    fullName: text('full_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull().default(''),
    category: text('category').notNull().default('General Enquiry'),
    subject: text('subject').notNull(),
    message: text('message').notNull(),
    status: text('status').notNull().default('new'),
    isImportant: boolean('is_important').notNull().default(false),
    sourcePage: text('source_page').notNull().default('/'),
    referrer: text('referrer').notNull().default(''),
    campaignSource: text('campaign_source').notNull().default(''),
    deviceCategory: text('device_category').notNull().default('desktop'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('enquiries_status_created_idx').on(table.status, table.createdAt)]
);

// 15. Enquiry Notes
export const enquiryNotes = pgTable('enquiry_notes', {
  id: serial('id').primaryKey(),
  enquiryId: integer('enquiry_id')
    .notNull()
    .references(() => enquiries.id, { onDelete: 'cascade' }),
  authorEmail: text('author_email').notNull(),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 16. Enquiry Status History
export const enquiryStatusHistory = pgTable('enquiry_status_history', {
  id: serial('id').primaryKey(),
  enquiryId: integer('enquiry_id')
    .notNull()
    .references(() => enquiries.id, { onDelete: 'cascade' }),
  previousStatus: text('previous_status'),
  newStatus: text('new_status').notNull(),
  changedByEmail: text('changed_by_email').notNull().default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const enquiriesRelations = relations(enquiries, ({ many }) => ({
  notes: many(enquiryNotes),
  statusHistory: many(enquiryStatusHistory),
}));

export const enquiryNotesRelations = relations(enquiryNotes, ({ one }) => ({
  enquiry: one(enquiries, {
    fields: [enquiryNotes.enquiryId],
    references: [enquiries.id],
  }),
}));

export const enquiryStatusHistoryRelations = relations(enquiryStatusHistory, ({ one }) => ({
  enquiry: one(enquiries, {
    fields: [enquiryStatusHistory.enquiryId],
    references: [enquiries.id],
  }),
}));

// 17. Anonymous Visitors
export const anonymousVisitors = pgTable(
  'anonymous_visitors',
  {
    id: serial('id').primaryKey(),
    visitorId: text('visitor_id').notNull().unique(),
    firstVisitAt: timestamp('first_visit_at').notNull().defaultNow(),
    lastVisitAt: timestamp('last_visit_at').notNull().defaultNow(),
    visitCount: integer('visit_count').notNull().default(1),
    deviceCategory: text('device_category').notNull().default('desktop'),
    browserCategory: text('browser_category').notNull().default('unknown'),
    osCategory: text('os_category').notNull().default('unknown'),
    country: text('country').notNull().default('Unknown'),
    region: text('region').notNull().default(''),
    city: text('city').notNull().default(''),
  },
  (table) => [index('visitors_last_visit_idx').on(table.lastVisitAt)]
);

// 18. Visitor Sessions
export const visitorSessions = pgTable(
  'visitor_sessions',
  {
    id: serial('id').primaryKey(),
    sessionId: text('session_id').notNull().unique(),
    visitorId: text('visitor_id').notNull(),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),
    durationSeconds: integer('duration_seconds').notNull().default(0),
    pageViewsCount: integer('page_views_count').notNull().default(0),
    eventsCount: integer('events_count').notNull().default(0),
    isReturning: boolean('is_returning').notNull().default(false),
    landingPage: text('landing_page').notNull().default('/'),
    referrer: text('referrer').notNull().default(''),
    campaignSource: text('campaign_source').notNull().default(''),
    deviceCategory: text('device_category').notNull().default('desktop'),
    browserCategory: text('browser_category').notNull().default('unknown'),
    osCategory: text('os_category').notNull().default('unknown'),
    country: text('country').notNull().default('Unknown'),
    region: text('region').notNull().default(''),
    city: text('city').notNull().default(''),
  },
  (table) => [
    index('sessions_visitor_started_idx').on(table.visitorId, table.startedAt),
    index('sessions_started_idx').on(table.startedAt),
  ]
);

// 19. Analytics Events
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: serial('id').primaryKey(),
    eventId: text('event_id').notNull().unique(),
    visitorId: text('visitor_id').notNull(),
    sessionId: text('session_id').notNull(),
    eventName: text('event_name').notNull(),
    pagePath: text('page_path').notNull().default('/'),
    sectionName: text('section_name').notNull().default(''),
    sourceLabel: text('source_label').notNull().default(''),
    targetCategory: text('target_category').notNull().default(''),
    projectId: text('project_id').notNull().default(''),
    projectTitle: text('project_title').notNull().default(''),
    deviceCategory: text('device_category').notNull().default('desktop'),
    referrer: text('referrer').notNull().default(''),
    campaignParams: jsonb('campaign_params').$type<Record<string, string>>().notNull().default({}),
    metadata: jsonb('metadata')
      .$type<Record<string, string | number | boolean>>()
      .notNull()
      .default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('events_name_created_idx').on(table.eventName, table.createdAt),
    index('events_visitor_idx').on(table.visitorId, table.createdAt),
    index('events_session_idx').on(table.sessionId, table.createdAt),
    index('events_project_idx').on(table.projectId, table.eventName),
  ]
);

// 20. Daily Analytics Summary
export const dailyAnalyticsSummary = pgTable(
  'daily_analytics_summary',
  {
    id: serial('id').primaryKey(),
    summaryDate: text('summary_date').notNull().unique(),
    totalVisitors: integer('total_visitors').notNull().default(0),
    uniqueVisitors: integer('unique_visitors').notNull().default(0),
    pageViews: integer('page_views').notNull().default(0),
    sessionsCount: integer('sessions_count').notNull().default(0),
    linkedinClicks: integer('linkedin_clicks').notNull().default(0),
    emailClicks: integer('email_clicks').notNull().default(0),
    phoneClicks: integer('phone_clicks').notNull().default(0),
    githubClicks: integer('github_clicks').notNull().default(0),
    whatsappClicks: integer('whatsapp_clicks').notNull().default(0),
    resumeDownloads: integer('resume_downloads').notNull().default(0),
    enquiriesCount: integer('enquiries_count').notNull().default(0),
    projectViews: integer('project_views').notNull().default(0),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('daily_summary_date_idx').on(table.summaryDate)]
);
