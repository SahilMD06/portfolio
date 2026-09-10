import 'server-only';

import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { TAGS, cachedQuery } from '@/lib/cache';
import { getDb } from '@/lib/db';
import {
  achievements,
  certifications,
  contactMessages,
  education,
  experiences,
  media,
  profile,
  projectScreenshots,
  projects,
  siteSettings,
  skillCategories,
  skills,
  socialLinks,
  type Achievement,
  type Certification,
  type Education,
  type Experience,
  type Media,
  type Profile,
  type Project,
  type SiteSettings,
  type SocialLink,
} from '@/lib/db/schema';

/**
 * Cached read layer for the public site.
 *
 * Every function is wrapped in `cachedQuery` and tagged, so admin writes
 * invalidate precisely the content they changed. Nothing here writes.
 */

/* -------------------------------------------------------------------------- */
/* Singletons                                                                 */
/* -------------------------------------------------------------------------- */

export const DEFAULT_PROFILE: Profile = {
  id: 1,
  fullName: 'Neel Khandelwal',
  headline: 'Software Engineer',
  shortBio: '',
  about: '',
  currentFocus: '',
  careerInterests: '',
  technicalInterests: '',
  location: '',
  email: '',
  avatarMediaId: null,
  resumeMediaId: null,
  updatedAt: new Date(0),
};

export const getProfile = cachedQuery(['profile'], [TAGS.profile], async (): Promise<Profile> => {
  const db = await getDb();
  const rows = await db.select().from(profile).where(eq(profile.id, 1)).limit(1);
  return rows[0] ?? DEFAULT_PROFILE;
});

export const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  seoTitle: '',
  seoDescription: '',
  ogImageMediaId: null,
  footerText: '',
  contactFormEnabled: true,
  analyticsEnabled: true,
  updatedAt: new Date(0),
};

export const getSiteSettings = cachedQuery(
  ['site-settings'],
  [TAGS.settings],
  async (): Promise<SiteSettings> => {
    const db = await getDb();
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
    return rows[0] ?? DEFAULT_SETTINGS;
  },
);

/* -------------------------------------------------------------------------- */
/* Skills                                                                     */
/* -------------------------------------------------------------------------- */

export interface SkillGroup {
  id: number;
  name: string;
  slug: string;
  skills: { id: number; name: string; level: number | null; featured: boolean }[];
}

export const getSkillGroups = cachedQuery(
  ['skill-groups'],
  [TAGS.skills],
  async (): Promise<SkillGroup[]> => {
    const db = await getDb();
    const rows = await db
      .select({
        categoryId: skillCategories.id,
        categoryName: skillCategories.name,
        categorySlug: skillCategories.slug,
        categoryOrder: skillCategories.displayOrder,
        skillId: skills.id,
        skillName: skills.name,
        level: skills.level,
        featured: skills.featured,
        skillOrder: skills.displayOrder,
      })
      .from(skillCategories)
      .leftJoin(skills, and(eq(skills.categoryId, skillCategories.id), eq(skills.visible, true)))
      .orderBy(
        asc(skillCategories.displayOrder),
        asc(skillCategories.id),
        asc(skills.displayOrder),
        asc(skills.id),
      );

    const groups = new Map<number, SkillGroup>();
    for (const row of rows) {
      let group = groups.get(row.categoryId);
      if (!group) {
        group = {
          id: row.categoryId,
          name: row.categoryName,
          slug: row.categorySlug,
          skills: [],
        };
        groups.set(row.categoryId, group);
      }
      if (row.skillId !== null && row.skillName !== null) {
        group.skills.push({
          id: row.skillId,
          name: row.skillName,
          level: row.level,
          featured: row.featured ?? false,
        });
      }
    }
    // Categories with no visible skills are not worth a heading.
    return [...groups.values()].filter((g) => g.skills.length > 0);
  },
);

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

export type PublicProject = Project & { image: Media | null };

const projectSelect = {
  project: projects,
  image: media,
};

export const getPublishedProjects = cachedQuery(
  ['projects', 'published'],
  [TAGS.projects, TAGS.media],
  async (): Promise<PublicProject[]> => {
    const db = await getDb();
    const rows = await db
      .select(projectSelect)
      .from(projects)
      .leftJoin(media, eq(projects.imageMediaId, media.id))
      .where(eq(projects.published, true))
      .orderBy(asc(projects.displayOrder), desc(projects.id));
    return rows.map((r) => ({ ...r.project, image: r.image }));
  },
);

export const getFeaturedProjects = cachedQuery(
  ['projects', 'featured'],
  [TAGS.projects, TAGS.media],
  async (): Promise<PublicProject[]> => {
    const db = await getDb();
    const rows = await db
      .select(projectSelect)
      .from(projects)
      .leftJoin(media, eq(projects.imageMediaId, media.id))
      .where(and(eq(projects.published, true), eq(projects.featured, true)))
      .orderBy(asc(projects.displayOrder), desc(projects.id));
    return rows.map((r) => ({ ...r.project, image: r.image }));
  },
);

export type ProjectDetail = PublicProject & {
  screenshots: { id: number; caption: string | null; media: Media }[];
};

export const getProjectBySlug = cachedQuery(
  ['project', 'by-slug'],
  [TAGS.projects, TAGS.media],
  async (slug: string): Promise<ProjectDetail | null> => {
    const db = await getDb();
    const rows = await db
      .select(projectSelect)
      .from(projects)
      .leftJoin(media, eq(projects.imageMediaId, media.id))
      .where(and(eq(projects.slug, slug), eq(projects.published, true)))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    const shots = await db
      .select({
        id: projectScreenshots.id,
        caption: projectScreenshots.caption,
        media,
      })
      .from(projectScreenshots)
      .innerJoin(media, eq(projectScreenshots.mediaId, media.id))
      .where(eq(projectScreenshots.projectId, row.project.id))
      .orderBy(asc(projectScreenshots.displayOrder), asc(projectScreenshots.id));

    return {
      ...row.project,
      image: row.image,
      screenshots: shots.map((s) => ({ id: s.id, caption: s.caption, media: s.media })),
    };
  },
);

/** Slugs for generateStaticParams / sitemap. */
export const getPublishedProjectSlugs = cachedQuery(
  ['projects', 'slugs'],
  [TAGS.projects],
  async (): Promise<{ slug: string; updatedAt: Date }[]> => {
    const db = await getDb();
    return db
      .select({ slug: projects.slug, updatedAt: projects.updatedAt })
      .from(projects)
      .where(eq(projects.published, true));
  },
);

/* -------------------------------------------------------------------------- */
/* Experience / education / certifications / achievements                     */
/* -------------------------------------------------------------------------- */

export type PublicExperience = Experience & { logo: Media | null; document: Media | null };

/** Two aliases of `media` are needed to join a logo and a document at once. */
const experienceLogo = alias(media, 'experience_logo');
const experienceDoc = alias(media, 'experience_doc');

export const getExperiences = cachedQuery(
  ['experiences'],
  [TAGS.experiences, TAGS.media],
  async (): Promise<PublicExperience[]> => {
    const db = await getDb();
    const rows = await db
      .select({ experience: experiences, logo: experienceLogo, document: experienceDoc })
      .from(experiences)
      .leftJoin(experienceLogo, eq(experiences.logoMediaId, experienceLogo.id))
      .leftJoin(experienceDoc, eq(experiences.documentMediaId, experienceDoc.id))
      .where(eq(experiences.published, true))
      .orderBy(asc(experiences.displayOrder), desc(experiences.id));
    return rows.map((r) => ({ ...r.experience, logo: r.logo, document: r.document }));
  },
);

export const getEducation = cachedQuery(
  ['education'],
  [TAGS.education],
  async (): Promise<Education[]> => {
    const db = await getDb();
    return db.select().from(education).orderBy(asc(education.displayOrder), desc(education.id));
  },
);

export type PublicCertification = Certification & { file: Media | null };

export const getCertifications = cachedQuery(
  ['certifications'],
  [TAGS.certifications, TAGS.media],
  async (): Promise<PublicCertification[]> => {
    const db = await getDb();
    const rows = await db
      .select({ certification: certifications, file: media })
      .from(certifications)
      .leftJoin(media, eq(certifications.mediaId, media.id))
      .orderBy(asc(certifications.displayOrder), desc(certifications.id));
    return rows.map((r) => ({ ...r.certification, file: r.file }));
  },
);

export type PublicAchievement = Achievement & { file: Media | null };

export const getAchievements = cachedQuery(
  ['achievements'],
  [TAGS.achievements, TAGS.media],
  async (): Promise<PublicAchievement[]> => {
    const db = await getDb();
    const rows = await db
      .select({ achievement: achievements, file: media })
      .from(achievements)
      .leftJoin(media, eq(achievements.mediaId, media.id))
      .orderBy(asc(achievements.displayOrder), desc(achievements.id));
    return rows.map((r) => ({ ...r.achievement, file: r.file }));
  },
);

export const getSocialLinks = cachedQuery(
  ['social-links'],
  [TAGS.social],
  async (): Promise<SocialLink[]> => {
    const db = await getDb();
    return db
      .select()
      .from(socialLinks)
      .where(eq(socialLinks.visible, true))
      .orderBy(asc(socialLinks.displayOrder), asc(socialLinks.id));
  },
);

/** Resume file for the header/hero buttons. */
export const getResumeMedia = cachedQuery(
  ['resume'],
  [TAGS.profile, TAGS.media],
  async (): Promise<Media | null> => {
    const db = await getDb();
    const rows = await db
      .select({ file: media })
      .from(profile)
      .innerJoin(media, eq(profile.resumeMediaId, media.id))
      .where(eq(profile.id, 1))
      .limit(1);
    return rows[0]?.file ?? null;
  },
);

/* -------------------------------------------------------------------------- */
/* Admin dashboard stats (never cached — always live)                         */
/* -------------------------------------------------------------------------- */

export interface DashboardStats {
  projects: number;
  experiences: number;
  skills: number;
  certifications: number;
  education: number;
  achievements: number;
  unreadMessages: number;
  lastUpdated: Date | null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await getDb();
  const [counts] = await db
    .select({
      projects: sql<number>`(select count(*)::int from ${projects})`,
      experiences: sql<number>`(select count(*)::int from ${experiences})`,
      skills: sql<number>`(select count(*)::int from ${skills})`,
      certifications: sql<number>`(select count(*)::int from ${certifications})`,
      education: sql<number>`(select count(*)::int from ${education})`,
      achievements: sql<number>`(select count(*)::int from ${achievements})`,
      unreadMessages: sql<number>`(select count(*)::int from ${contactMessages} where ${contactMessages.read} = false)`,
      lastUpdated: sql<Date | null>`greatest(
        (select max(${projects.updatedAt}) from ${projects}),
        (select max(${experiences.updatedAt}) from ${experiences}),
        (select max(${skills.updatedAt}) from ${skills}),
        (select max(${profile.updatedAt}) from ${profile})
      )`,
    })
    .from(sql`(select 1) as _`);

  return (
    counts ?? {
      projects: 0,
      experiences: 0,
      skills: 0,
      certifications: 0,
      education: 0,
      achievements: 0,
      unreadMessages: 0,
      lastUpdated: null,
    }
  );
}
