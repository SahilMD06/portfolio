import { z } from 'zod';

/**
 * Single source of truth for input shape. Used by server actions, the REST
 * admin API and (for messages) the public contact endpoint, so validation can
 * never drift between entry points.
 */

const trimmed = (max: number) => z.string().trim().max(max);
const requiredText = (max: number, label: string) =>
  trimmed(max).min(1, `${label} is required.`);

/**
 * A safe link target.
 *
 * z.string().url() alone accepts `javascript:` and `data:` URLs, which would
 * become an XSS vector once rendered into an href, so the scheme is
 * allow-listed explicitly.
 */
const SAFE_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:']);

const safeUrl = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => {
      let parsed: URL;
      try {
        parsed = new URL(value);
      } catch {
        return false;
      }
      return SAFE_URL_SCHEMES.has(parsed.protocol);
    }, 'Must be a valid http(s) or mailto URL.');

/** Empty string -> undefined, so optional URL fields can be cleared. */
const optionalUrl = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  safeUrl().optional(),
);

const optionalText = (max: number) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), trimmed(max).optional());

/** YYYY-MM or YYYY-MM-DD, kept as text so partial dates are representable. */
const partialDate = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z
    .string()
    .regex(/^\d{4}(-\d{2}){0,2}$/, 'Use YYYY, YYYY-MM or YYYY-MM-DD.')
    .optional(),
);

export const slugSchema = trimmed(220)
  .min(1, 'Slug is required.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.');

/** Accepts a comma-separated string (from a text input) or an array. */
export const stringListSchema = z.preprocess(
  (v) => {
    if (typeof v === 'string') {
      return v
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return v ?? [];
  },
  z.array(trimmed(120).min(1)).max(60),
);

const optionalMediaId = z.preprocess(
  (v) => (v === '' || v === null || v === undefined || v === 'none' ? undefined : Number(v)),
  z.number().int().positive().optional(),
);

const displayOrder = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
  z.number().int().min(0).max(10_000),
);

const checkbox = z.preprocess((v) => v === true || v === 'true' || v === 'on' || v === '1', z.boolean());

/* -------------------------------------------------------------------------- */

export const loginSchema = z.object({
  email: trimmed(255).min(1, 'Email is required.').email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.').max(200),
});

export const profileSchema = z.object({
  fullName: requiredText(160, 'Name'),
  headline: requiredText(240, 'Headline'),
  shortBio: trimmed(1000).default(''),
  about: trimmed(6000).default(''),
  currentFocus: trimmed(2000).default(''),
  careerInterests: trimmed(2000).default(''),
  technicalInterests: trimmed(2000).default(''),
  location: trimmed(160).default(''),
  email: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? '' : v),
    z.union([z.literal(''), z.string().email('Enter a valid email address.').max(255)]),
  ),
  avatarMediaId: optionalMediaId,
  resumeMediaId: optionalMediaId,
});

export const siteSettingsSchema = z.object({
  seoTitle: trimmed(200).default(''),
  seoDescription: trimmed(400).default(''),
  ogImageMediaId: optionalMediaId,
  footerText: trimmed(300).default(''),
  contactFormEnabled: checkbox,
  analyticsEnabled: checkbox,
});

export const skillCategorySchema = z.object({
  name: requiredText(120, 'Category name'),
  slug: slugSchema,
  displayOrder,
});

export const skillSchema = z.object({
  categoryId: z.preprocess((v) => Number(v), z.number().int().positive('Choose a category.')),
  name: requiredText(120, 'Skill name'),
  level: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().min(1).max(5).optional(),
  ),
  featured: checkbox,
  visible: checkbox,
  displayOrder,
});

export const projectSchema = z.object({
  title: requiredText(200, 'Title'),
  slug: slugSchema,
  summary: trimmed(400).default(''),
  description: trimmed(20000).default(''),
  category: trimmed(120).default(''),
  githubUrl: optionalUrl,
  demoUrl: optionalUrl,
  imageMediaId: optionalMediaId,
  technologies: stringListSchema,
  featured: checkbox,
  published: checkbox,
  startDate: partialDate,
  endDate: partialDate,
  displayOrder,
});

export const experienceSchema = z.object({
  company: requiredText(200, 'Company'),
  role: requiredText(200, 'Role'),
  employmentType: trimmed(60).default('Internship'),
  location: trimmed(160).default(''),
  startDate: z
    .string()
    .trim()
    .regex(/^\d{4}(-\d{2}){0,2}$/, 'Use YYYY, YYYY-MM or YYYY-MM-DD.'),
  endDate: partialDate,
  isCurrent: checkbox,
  description: trimmed(6000).default(''),
  responsibilities: stringListSchema,
  achievements: stringListSchema,
  technologies: stringListSchema,
  logoMediaId: optionalMediaId,
  documentMediaId: optionalMediaId,
  published: checkbox,
  displayOrder,
});

export const educationSchema = z.object({
  institution: requiredText(220, 'Institution'),
  degree: requiredText(200, 'Degree'),
  field: trimmed(200).default(''),
  startDate: z
    .string()
    .trim()
    .regex(/^\d{4}(-\d{2}){0,2}$/, 'Use YYYY, YYYY-MM or YYYY-MM-DD.'),
  endDate: partialDate,
  grade: optionalText(60),
  description: trimmed(4000).default(''),
  achievements: stringListSchema,
  displayOrder,
});

export const certificationSchema = z.object({
  name: requiredText(240, 'Certification name'),
  issuer: requiredText(200, 'Issuing organisation'),
  issueDate: partialDate,
  expiryDate: partialDate,
  credentialId: optionalText(200),
  credentialUrl: optionalUrl,
  mediaId: optionalMediaId,
  displayOrder,
});

export const achievementSchema = z.object({
  title: requiredText(240, 'Title'),
  description: trimmed(4000).default(''),
  organization: trimmed(200).default(''),
  date: partialDate,
  url: optionalUrl,
  mediaId: optionalMediaId,
  displayOrder,
});

export const socialLinkSchema = z.object({
  label: requiredText(80, 'Label'),
  platform: trimmed(40).default('link'),
  url: safeUrl(),
  visible: checkbox,
  displayOrder,
});

export const contactMessageSchema = z.object({
  name: requiredText(160, 'Name').min(2, 'Please enter your name.'),
  email: trimmed(255).min(1, 'Email is required.').email('Enter a valid email address.'),
  message: trimmed(5000).min(10, 'Please write at least 10 characters.'),
  /** Honeypot: bots fill hidden fields, humans never see them. */
  website: z.string().max(0, 'Spam detected.').optional().or(z.literal('')),
});

/**
 * Changing the admin password requires the current one, so a stolen session
 * cannot be escalated into permanent account takeover.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.').max(200),
    newPassword: z
      .string()
      .min(12, 'Use at least 12 characters.')
      .max(200, 'Use at most 200 characters.'),
    confirmPassword: z.string().max(200),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'The two passwords do not match.',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'The new password must be different from the current one.',
    path: ['newPassword'],
  });

export const reorderSchema = z.object({
  ids: z.array(z.number().int().positive()).max(500),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type SkillCategoryInput = z.infer<typeof skillCategorySchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type CertificationInput = z.infer<typeof certificationSchema>;
export type AchievementInput = z.infer<typeof achievementSchema>;
export type SocialLinkInput = z.infer<typeof socialLinkSchema>;
export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
