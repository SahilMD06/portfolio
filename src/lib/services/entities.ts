import 'server-only';

import { TAGS } from '@/lib/cache';
import {
  achievements,
  certifications,
  education,
  experiences,
  projects,
  skillCategories,
  skills,
  socialLinks,
  type Achievement,
  type Certification,
  type Education,
  type Experience,
  type Project,
  type Skill,
  type SkillCategory,
  type SocialLink,
} from '@/lib/db/schema';
import { createCrudService } from './crud';

/**
 * Admin-facing CRUD services. Everything that writes content goes through
 * exactly one of these, so cache invalidation can never be forgotten.
 */

export const projectService = createCrudService<Project, typeof projects.$inferInsert>(projects, {
  tags: [TAGS.projects],
  // The dynamic pattern clears every cached /projects/<slug> render, so a
  // deleted project stops returning a stale 200 and an edited one updates.
  paths: ['/projects', { path: '/projects/[slug]', type: 'page' }],
  touchUpdatedAt: true,
});

export const experienceService = createCrudService<Experience, typeof experiences.$inferInsert>(
  experiences,
  { tags: [TAGS.experiences], touchUpdatedAt: true },
);

export const skillService = createCrudService<Skill, typeof skills.$inferInsert>(skills, {
  tags: [TAGS.skills],
  touchUpdatedAt: true,
});

export const skillCategoryService = createCrudService<
  SkillCategory,
  typeof skillCategories.$inferInsert
>(skillCategories, { tags: [TAGS.skills] });

export const educationService = createCrudService<Education, typeof education.$inferInsert>(
  education,
  { tags: [TAGS.education], touchUpdatedAt: true },
);

export const certificationService = createCrudService<
  Certification,
  typeof certifications.$inferInsert
>(certifications, { tags: [TAGS.certifications], touchUpdatedAt: true });

export const achievementService = createCrudService<Achievement, typeof achievements.$inferInsert>(
  achievements,
  { tags: [TAGS.achievements], touchUpdatedAt: true },
);

export const socialLinkService = createCrudService<SocialLink, typeof socialLinks.$inferInsert>(
  socialLinks,
  { tags: [TAGS.social] },
);
