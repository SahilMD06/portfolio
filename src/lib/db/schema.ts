import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    /** scrypt digest formatted as scrypt$N$r$p$salt$hash - never plain text. */
    passwordHash: text('password_hash').notNull(),
    name: varchar('name', { length: 120 }).notNull().default('Admin'),
    role: varchar('role', { length: 20 }).notNull().default('admin'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('users_email_key').on(t.email)],
);

export const sessions = pgTable(
  'sessions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** SHA-256 of the opaque cookie token. The raw token is never stored. */
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    userAgent: text('user_agent'),
  },
  (t) => [
    uniqueIndex('sessions_token_hash_key').on(t.tokenHash),
    index('sessions_user_id_idx').on(t.userId),
    index('sessions_expires_at_idx').on(t.expiresAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* Media (metadata only - the bytes live in object storage)                   */
/* -------------------------------------------------------------------------- */

export const media = pgTable(
  'media',
  {
    id: serial('id').primaryKey(),
    filename: varchar('filename', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 120 }).notNull(),
    size: integer('size').notNull(),
    /** Opaque key within the storage driver. Never a client-supplied path. */
    storageKey: varchar('storage_key', { length: 300 }).notNull(),
    driver: varchar('driver', { length: 20 }).notNull().default('local'),
    width: integer('width'),
    height: integer('height'),
    alt: varchar('alt', { length: 300 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('media_storage_key_key').on(t.storageKey)],
);

/* -------------------------------------------------------------------------- */
/* Singletons: profile + site settings                                        */
/* -------------------------------------------------------------------------- */

export const profile = pgTable('profile', {
  /** Always row id = 1. */
  id: integer('id').primaryKey().default(1),
  fullName: varchar('full_name', { length: 160 }).notNull(),
  headline: varchar('headline', { length: 240 }).notNull(),
  shortBio: text('short_bio').notNull().default(''),
  about: text('about').notNull().default(''),
  currentFocus: text('current_focus').notNull().default(''),
  careerInterests: text('career_interests').notNull().default(''),
  technicalInterests: text('technical_interests').notNull().default(''),
  location: varchar('location', { length: 160 }).notNull().default(''),
  email: varchar('email', { length: 255 }).notNull().default(''),
  avatarMediaId: integer('avatar_media_id').references(() => media.id, { onDelete: 'set null' }),
  resumeMediaId: integer('resume_media_id').references(() => media.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const siteSettings = pgTable('site_settings', {
  id: integer('id').primaryKey().default(1),
  seoTitle: varchar('seo_title', { length: 200 }).notNull().default(''),
  seoDescription: varchar('seo_description', { length: 400 }).notNull().default(''),
  ogImageMediaId: integer('og_image_media_id').references(() => media.id, { onDelete: 'set null' }),
  footerText: varchar('footer_text', { length: 300 }).notNull().default(''),
  contactFormEnabled: boolean('contact_form_enabled').notNull().default(true),
  analyticsEnabled: boolean('analytics_enabled').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/* Skills                                                                     */
/* -------------------------------------------------------------------------- */

export const skillCategories = pgTable(
  'skill_categories',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 120 }).notNull(),
    slug: varchar('slug', { length: 140 }).notNull(),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('skill_categories_slug_key').on(t.slug)],
);

export const skills = pgTable(
  'skills',
  {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => skillCategories.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    /** Optional 1-5 proficiency indicator. */
    level: integer('level'),
    featured: boolean('featured').notNull().default(false),
    visible: boolean('visible').notNull().default(true),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('skills_category_order_idx').on(t.categoryId, t.displayOrder)],
);

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

export const projects = pgTable(
  'projects',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 220 }).notNull(),
    summary: varchar('summary', { length: 400 }).notNull().default(''),
    description: text('description').notNull().default(''),
    category: varchar('category', { length: 120 }).notNull().default(''),
    githubUrl: text('github_url'),
    demoUrl: text('demo_url'),
    imageMediaId: integer('image_media_id').references(() => media.id, { onDelete: 'set null' }),
    /** Denormalised on purpose: technologies are display-only labels. */
    technologies: text('technologies').array().notNull().default([]),
    featured: boolean('featured').notNull().default(false),
    published: boolean('published').notNull().default(true),
    startDate: varchar('start_date', { length: 20 }),
    endDate: varchar('end_date', { length: 20 }),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('projects_slug_key').on(t.slug),
    index('projects_published_order_idx').on(t.published, t.displayOrder),
    index('projects_featured_idx').on(t.featured),
  ],
);

export const projectScreenshots = pgTable(
  'project_screenshots',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    mediaId: integer('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'cascade' }),
    caption: varchar('caption', { length: 300 }),
    displayOrder: integer('display_order').notNull().default(0),
  },
  (t) => [index('project_screenshots_project_idx').on(t.projectId, t.displayOrder)],
);

/* -------------------------------------------------------------------------- */
/* Experience                                                                 */
/* -------------------------------------------------------------------------- */

export const experiences = pgTable(
  'experiences',
  {
    id: serial('id').primaryKey(),
    company: varchar('company', { length: 200 }).notNull(),
    role: varchar('role', { length: 200 }).notNull(),
    employmentType: varchar('employment_type', { length: 60 }).notNull().default('Internship'),
    location: varchar('location', { length: 160 }).notNull().default(''),
    startDate: varchar('start_date', { length: 20 }).notNull(),
    endDate: varchar('end_date', { length: 20 }),
    isCurrent: boolean('is_current').notNull().default(false),
    description: text('description').notNull().default(''),
    responsibilities: text('responsibilities').array().notNull().default([]),
    achievements: text('achievements').array().notNull().default([]),
    technologies: text('technologies').array().notNull().default([]),
    logoMediaId: integer('logo_media_id').references(() => media.id, { onDelete: 'set null' }),
    documentMediaId: integer('document_media_id').references(() => media.id, {
      onDelete: 'set null',
    }),
    published: boolean('published').notNull().default(true),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('experiences_order_idx').on(t.published, t.displayOrder)],
);

/* -------------------------------------------------------------------------- */
/* Education / Certifications / Achievements                                  */
/* -------------------------------------------------------------------------- */

export const education = pgTable(
  'education',
  {
    id: serial('id').primaryKey(),
    institution: varchar('institution', { length: 220 }).notNull(),
    degree: varchar('degree', { length: 200 }).notNull(),
    field: varchar('field', { length: 200 }).notNull().default(''),
    startDate: varchar('start_date', { length: 20 }).notNull(),
    endDate: varchar('end_date', { length: 20 }),
    grade: varchar('grade', { length: 60 }),
    description: text('description').notNull().default(''),
    achievements: text('achievements').array().notNull().default([]),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('education_order_idx').on(t.displayOrder)],
);

export const certifications = pgTable(
  'certifications',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 240 }).notNull(),
    issuer: varchar('issuer', { length: 200 }).notNull(),
    issueDate: varchar('issue_date', { length: 20 }),
    expiryDate: varchar('expiry_date', { length: 20 }),
    credentialId: varchar('credential_id', { length: 200 }),
    credentialUrl: text('credential_url'),
    mediaId: integer('media_id').references(() => media.id, { onDelete: 'set null' }),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('certifications_order_idx').on(t.displayOrder)],
);

export const achievements = pgTable(
  'achievements',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 240 }).notNull(),
    description: text('description').notNull().default(''),
    organization: varchar('organization', { length: 200 }).notNull().default(''),
    date: varchar('date', { length: 20 }),
    url: text('url'),
    mediaId: integer('media_id').references(() => media.id, { onDelete: 'set null' }),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('achievements_order_idx').on(t.displayOrder)],
);

/* -------------------------------------------------------------------------- */
/* Social links + contact                                                     */
/* -------------------------------------------------------------------------- */

export const socialLinks = pgTable(
  'social_links',
  {
    id: serial('id').primaryKey(),
    label: varchar('label', { length: 80 }).notNull(),
    /** Drives which built-in icon renders: github | linkedin | mail | link. */
    platform: varchar('platform', { length: 40 }).notNull().default('link'),
    url: text('url').notNull(),
    visible: boolean('visible').notNull().default(true),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('social_links_order_idx').on(t.visible, t.displayOrder)],
);

export const contactMessages = pgTable(
  'contact_messages',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 160 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    message: text('message').notNull(),
    read: boolean('read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('contact_messages_created_idx').on(t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/* Inferred types                                                             */
/* -------------------------------------------------------------------------- */

export type User = typeof users.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Profile = typeof profile.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type SkillCategory = typeof skillCategories.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectScreenshot = typeof projectScreenshots.$inferSelect;
export type Experience = typeof experiences.$inferSelect;
export type Education = typeof education.$inferSelect;
export type Certification = typeof certifications.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type SocialLink = typeof socialLinks.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
