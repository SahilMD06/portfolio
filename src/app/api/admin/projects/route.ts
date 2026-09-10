import { json, parseBody, withAdmin } from '@/app/api/_lib/handler';
import { projectService } from '@/lib/services/entities';
import { projectSchema } from '@/lib/validation/schemas';

/** Admin read: includes unpublished drafts. Requires a valid admin session. */
export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const projects = await projectService.list();
    return json({ projects });
  });
}

export async function POST(request: Request) {
  return withAdmin(request, async () => {
    const parsed = await parseBody(request, projectSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    const created = await projectService.create({
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
    });

    return json({ project: created }, 201);
  });
}
