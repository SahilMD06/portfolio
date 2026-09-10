import { json, withPublic } from '@/app/api/_lib/handler';
import {
  getAchievements,
  getCertifications,
  getEducation,
  getExperiences,
  getProfile,
  getPublishedProjects,
  getSkillGroups,
  getSocialLinks,
} from '@/lib/services/content';
import { mediaUrl } from '@/lib/services/media';

/**
 * The whole public portfolio as JSON, in one request.
 *
 * Useful for embedding the content elsewhere (a resume generator, another
 * site). Reads go through the same cached service layer as the pages, so this
 * adds no extra database load.
 */
export const GET = withPublic(async () => {
  const [profile, skills, projects, experiences, education, certifications, achievements, links] =
    await Promise.all([
      getProfile(),
      getSkillGroups(),
      getPublishedProjects(),
      getExperiences(),
      getEducation(),
      getCertifications(),
      getAchievements(),
      getSocialLinks(),
    ]);

  return json({
    profile: {
      fullName: profile.fullName,
      headline: profile.headline,
      shortBio: profile.shortBio,
      about: profile.about,
      location: profile.location,
      email: profile.email,
    },
    skills,
    projects: projects.map((p) => ({
      title: p.title,
      slug: p.slug,
      summary: p.summary,
      technologies: p.technologies,
      featured: p.featured,
      url: `/projects/${p.slug}`,
      image: mediaUrl(p.image),
    })),
    experiences: experiences.map((e) => ({
      company: e.company,
      role: e.role,
      employmentType: e.employmentType,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      isCurrent: e.isCurrent,
      description: e.description,
      responsibilities: e.responsibilities,
      achievements: e.achievements,
      technologies: e.technologies,
    })),
    education,
    certifications: certifications.map((c) => ({
      name: c.name,
      issuer: c.issuer,
      issueDate: c.issueDate,
      credentialId: c.credentialId,
      credentialUrl: c.credentialUrl,
    })),
    achievements: achievements.map((a) => ({
      title: a.title,
      organization: a.organization,
      description: a.description,
      date: a.date,
      url: a.url,
    })),
    socialLinks: links.map((l) => ({ label: l.label, platform: l.platform, url: l.url })),
  });
});
