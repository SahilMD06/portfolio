'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import type { z } from 'zod';

import { requireAdmin } from '@/lib/auth/session';
import { TAGS, revalidateEntity } from '@/lib/cache';
import { getDb } from '@/lib/db';
import { profile, siteSettings } from '@/lib/db/schema';
import {
  achievementService,
  certificationService,
  educationService,
  experienceService,
  projectService,
  skillCategoryService,
  skillService,
  socialLinkService,
} from '@/lib/services/entities';
import { deleteMedia, uploadMedia } from '@/lib/services/media';
import { UploadError } from '@/lib/storage/policy';
import {
  achievementSchema,
  certificationSchema,
  educationSchema,
  experienceSchema,
  profileSchema,
  projectSchema,
  siteSettingsSchema,
  skillCategorySchema,
  skillSchema,
  socialLinkSchema,
} from '@/lib/validation/schemas';
import type { ActionResult } from './types';

/* -------------------------------------------------------------------------- */
/* Shared plumbing                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Every export in this file is a server action reachable over the network, so
 * each one begins with `requireAdmin()`. There is no shared middleware that
 * could be bypassed — authorisation is re-checked per call.
 */

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

/** Unique-violation code in PostgreSQL. */
function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === '23505';
}

function failure(error: unknown, fallback: string): ActionResult {
  if (error instanceof UploadError) return { ok: false, message: error.message };
  if (isUniqueViolation(error)) {
    return {
      ok: false,
      message: 'That slug is already used by another entry. Choose a different one.',
      fieldErrors: { slug: 'Already in use.' },
    };
  }
  // Log internally; never return database text to the browser.
  console.error(fallback, error);
  return { ok: false, message: fallback };
}

type Service<TRow extends { id: number }, TInsert> = {
  create(values: TInsert): Promise<TRow>;
  update(id: number, values: Partial<TInsert>): Promise<TRow | null>;
  remove(id: number): Promise<boolean>;
  reorder(ids: number[]): Promise<void>;
};

/**
 * Shared save path: authorise, validate, write, report.
 * `id` of 0 or undefined means "create".
 */
async function save<TSchema extends z.ZodType, TRow extends { id: number }, TInsert>(
  schema: TSchema,
  service: Service<TRow, TInsert>,
  formData: FormData,
  toValues: (data: z.infer<TSchema>) => TInsert,
  label: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, message: 'You are not signed in.' };
  }

  const raw = Object.fromEntries(formData) as Record<string, unknown>;
  const id = Number(raw.id ?? 0);
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please correct the highlighted fields.',
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    const values = toValues(parsed.data);
    if (Number.isInteger(id) && id > 0) {
      const updated = await service.update(id, values as Partial<TInsert>);
      if (!updated) return { ok: false, message: `${label} no longer exists.` };
      return { ok: true, message: `${label} saved.` };
    }
    await service.create(values);
    return { ok: true, message: `${label} created.` };
  } catch (error) {
    return failure(error, `Could not save ${label.toLowerCase()}.`);
  }
}

async function remove<TRow extends { id: number }, TInsert>(
  service: Service<TRow, TInsert>,
  id: number,
  label: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, message: 'You are not signed in.' };
  }
  if (!Number.isInteger(id) || id <= 0) return { ok: false, message: 'Invalid identifier.' };

  try {
    const deleted = await service.remove(id);
    return deleted
      ? { ok: true, message: `${label} deleted.` }
      : { ok: false, message: `${label} no longer exists.` };
  } catch (error) {
    return failure(error, `Could not delete ${label.toLowerCase()}.`);
  }
}

async function reorder<TRow extends { id: number }, TInsert>(
  service: Service<TRow, TInsert>,
  ids: number[],
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, message: 'You are not signed in.' };
  }
  const clean = ids.filter((id) => Number.isInteger(id) && id > 0);
  if (clean.length === 0) return { ok: false, message: 'Nothing to reorder.' };

  try {
    await service.reorder(clean);
    return { ok: true, message: 'Order updated.' };
  } catch (error) {
    return failure(error, 'Could not update the order.');
  }
}

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

export async function saveProject(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return save(projectSchema, projectService, formData, (d) => ({
    title: d.title,
    slug: d.slug,
    summary: d.summary,
    description: d.description,
    category: d.category,
    githubUrl: d.githubUrl ?? null,
    demoUrl: d.demoUrl ?? null,
    imageMediaId: d.imageMediaId ?? null,
    technologies: d.technologies,
    featured: d.featured,
    published: d.published,
    startDate: d.startDate ?? null,
    endDate: d.endDate ?? null,
    displayOrder: d.displayOrder,
  }), 'Project');
}

export async function deleteProject(id: number): Promise<ActionResult> {
  const result = await remove(projectService, id, 'Project');
  if (result.ok) revalidatePath('/projects');
  return result;
}

export async function reorderProjects(ids: number[]): Promise<ActionResult> {
  return reorder(projectService, ids);
}

/* -------------------------------------------------------------------------- */
/* Experience                                                                 */
/* -------------------------------------------------------------------------- */

export async function saveExperience(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return save(experienceSchema, experienceService, formData, (d) => ({
    company: d.company,
    role: d.role,
    employmentType: d.employmentType,
    location: d.location,
    startDate: d.startDate,
    endDate: d.isCurrent ? null : (d.endDate ?? null),
    isCurrent: d.isCurrent,
    description: d.description,
    responsibilities: d.responsibilities,
    achievements: d.achievements,
    technologies: d.technologies,
    logoMediaId: d.logoMediaId ?? null,
    documentMediaId: d.documentMediaId ?? null,
    published: d.published,
    displayOrder: d.displayOrder,
  }), 'Experience');
}

export async function deleteExperience(id: number): Promise<ActionResult> {
  return remove(experienceService, id, 'Experience');
}

export async function reorderExperiences(ids: number[]): Promise<ActionResult> {
  return reorder(experienceService, ids);
}

/* -------------------------------------------------------------------------- */
/* Skills                                                                     */
/* -------------------------------------------------------------------------- */

export async function saveSkill(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return save(skillSchema, skillService, formData, (d) => ({
    categoryId: d.categoryId,
    name: d.name,
    level: d.level ?? null,
    featured: d.featured,
    visible: d.visible,
    displayOrder: d.displayOrder,
  }), 'Skill');
}

export async function deleteSkill(id: number): Promise<ActionResult> {
  return remove(skillService, id, 'Skill');
}

export async function reorderSkills(ids: number[]): Promise<ActionResult> {
  return reorder(skillService, ids);
}

export async function saveSkillCategory(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return save(skillCategorySchema, skillCategoryService, formData, (d) => ({
    name: d.name,
    slug: d.slug,
    displayOrder: d.displayOrder,
  }), 'Category');
}

/** Deleting a category cascades to its skills (FK ON DELETE CASCADE). */
export async function deleteSkillCategory(id: number): Promise<ActionResult> {
  return remove(skillCategoryService, id, 'Category');
}

/* -------------------------------------------------------------------------- */
/* Education / Certifications / Achievements / Social                         */
/* -------------------------------------------------------------------------- */

export async function saveEducation(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return save(educationSchema, educationService, formData, (d) => ({
    institution: d.institution,
    degree: d.degree,
    field: d.field,
    startDate: d.startDate,
    endDate: d.endDate ?? null,
    grade: d.grade ?? null,
    description: d.description,
    achievements: d.achievements,
    displayOrder: d.displayOrder,
  }), 'Education entry');
}

export async function deleteEducation(id: number): Promise<ActionResult> {
  return remove(educationService, id, 'Education entry');
}

export async function reorderEducation(ids: number[]): Promise<ActionResult> {
  return reorder(educationService, ids);
}

export async function saveCertification(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return save(certificationSchema, certificationService, formData, (d) => ({
    name: d.name,
    issuer: d.issuer,
    issueDate: d.issueDate ?? null,
    expiryDate: d.expiryDate ?? null,
    credentialId: d.credentialId ?? null,
    credentialUrl: d.credentialUrl ?? null,
    mediaId: d.mediaId ?? null,
    displayOrder: d.displayOrder,
  }), 'Certification');
}

export async function deleteCertification(id: number): Promise<ActionResult> {
  return remove(certificationService, id, 'Certification');
}

export async function reorderCertifications(ids: number[]): Promise<ActionResult> {
  return reorder(certificationService, ids);
}

export async function saveAchievement(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return save(achievementSchema, achievementService, formData, (d) => ({
    title: d.title,
    description: d.description,
    organization: d.organization,
    date: d.date ?? null,
    url: d.url ?? null,
    mediaId: d.mediaId ?? null,
    displayOrder: d.displayOrder,
  }), 'Achievement');
}

export async function deleteAchievement(id: number): Promise<ActionResult> {
  return remove(achievementService, id, 'Achievement');
}

export async function reorderAchievements(ids: number[]): Promise<ActionResult> {
  return reorder(achievementService, ids);
}

export async function saveSocialLink(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return save(socialLinkSchema, socialLinkService, formData, (d) => ({
    label: d.label,
    platform: d.platform,
    url: d.url,
    visible: d.visible,
    displayOrder: d.displayOrder,
  }), 'Link');
}

export async function deleteSocialLink(id: number): Promise<ActionResult> {
  return remove(socialLinkService, id, 'Link');
}

export async function reorderSocialLinks(ids: number[]): Promise<ActionResult> {
  return reorder(socialLinkService, ids);
}

/* -------------------------------------------------------------------------- */
/* Singletons: profile + site settings                                        */
/* -------------------------------------------------------------------------- */

export async function saveProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, message: 'You are not signed in.' };
  }

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please correct the highlighted fields.',
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    const d = parsed.data;
    const values = {
      fullName: d.fullName,
      headline: d.headline,
      shortBio: d.shortBio,
      about: d.about,
      currentFocus: d.currentFocus,
      careerInterests: d.careerInterests,
      technicalInterests: d.technicalInterests,
      location: d.location,
      email: d.email,
      avatarMediaId: d.avatarMediaId ?? null,
      resumeMediaId: d.resumeMediaId ?? null,
      updatedAt: new Date(),
    };

    const db = await getDb();
    // Single-row table: upsert so a missing row is created rather than failing.
    await db
      .insert(profile)
      .values({ id: 1, ...values })
      .onConflictDoUpdate({ target: profile.id, set: values });

    revalidateEntity([TAGS.profile, TAGS.settings]);
    return { ok: true, message: 'Profile saved.' };
  } catch (error) {
    return failure(error, 'Could not save your profile.');
  }
}

export async function saveSiteSettings(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, message: 'You are not signed in.' };
  }

  const parsed = siteSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please correct the highlighted fields.',
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    const d = parsed.data;
    const values = {
      seoTitle: d.seoTitle,
      seoDescription: d.seoDescription,
      ogImageMediaId: d.ogImageMediaId ?? null,
      footerText: d.footerText,
      contactFormEnabled: d.contactFormEnabled,
      analyticsEnabled: d.analyticsEnabled,
      updatedAt: new Date(),
    };

    const db = await getDb();
    await db
      .insert(siteSettings)
      .values({ id: 1, ...values })
      .onConflictDoUpdate({ target: siteSettings.id, set: values });

    revalidateEntity([TAGS.settings]);
    return { ok: true, message: 'Settings saved.' };
  } catch (error) {
    return failure(error, 'Could not save settings.');
  }
}

/* -------------------------------------------------------------------------- */
/* Media                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Uploads a file and returns its media id. Validation (type + size) happens
 * inside `uploadMedia` before a single byte is written to storage.
 */
export async function uploadFile(
  _prev: ActionResult & { mediaId?: number },
  formData: FormData,
): Promise<ActionResult & { mediaId?: number }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, message: 'You are not signed in.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Choose a file to upload.' };
  }

  try {
    const alt = formData.get('alt');
    const created = await uploadMedia(file, typeof alt === 'string' ? alt : undefined);
    return { ok: true, message: `Uploaded ${created.filename}.`, mediaId: created.id };
  } catch (error) {
    return failure(error, 'Upload failed.');
  }
}

export async function deleteFile(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, message: 'You are not signed in.' };
  }
  if (!Number.isInteger(id) || id <= 0) return { ok: false, message: 'Invalid identifier.' };

  try {
    const deleted = await deleteMedia(id);
    return deleted
      ? { ok: true, message: 'File deleted.' }
      : { ok: false, message: 'File no longer exists.' };
  } catch (error) {
    return failure(error, 'Could not delete the file.');
  }
}

/** Sets (or clears) the resume shown on the public site. */
export async function setResume(mediaId: number | null): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, message: 'You are not signed in.' };
  }

  try {
    const db = await getDb();
    await db
      .insert(profile)
      .values({
        id: 1,
        fullName: 'Neel Khandelwal',
        headline: 'Software Engineer',
        resumeMediaId: mediaId,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: profile.id,
        set: { resumeMediaId: mediaId, updatedAt: new Date() },
      });

    revalidateEntity([TAGS.profile, TAGS.media]);
    return { ok: true, message: mediaId ? 'Resume updated.' : 'Resume removed.' };
  } catch (error) {
    return failure(error, 'Could not update the resume.');
  }
}

/** Marks a contact message as read. */
export async function markMessageRead(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, message: 'You are not signed in.' };
  }

  try {
    const { contactMessages } = await import('@/lib/db/schema');
    const db = await getDb();
    await db.update(contactMessages).set({ read: true }).where(eq(contactMessages.id, id));
    revalidatePath('/admin/messages');
    return { ok: true };
  } catch (error) {
    return failure(error, 'Could not update the message.');
  }
}
