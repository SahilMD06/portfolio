import { json, withPublic } from '@/app/api/_lib/handler';
import { getPublishedProjects } from '@/lib/services/content';
import { mediaUrl } from '@/lib/services/media';

/** Public read: published projects only. Never exposes drafts. */
export const GET = withPublic(async () => {
  const projects = await getPublishedProjects();
  return json({
    projects: projects.map((project) => ({
      id: project.id,
      title: project.title,
      slug: project.slug,
      summary: project.summary,
      category: project.category,
      technologies: project.technologies,
      githubUrl: project.githubUrl,
      demoUrl: project.demoUrl,
      featured: project.featured,
      startDate: project.startDate,
      endDate: project.endDate,
      image: mediaUrl(project.image),
      url: `/projects/${project.slug}`,
    })),
  });
});
