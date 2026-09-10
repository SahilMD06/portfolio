import { error, json, parseBody, parseId, withAdmin } from '@/app/api/_lib/handler';
import { projectService } from '@/lib/services/entities';
import { projectSchema } from '@/lib/validation/schemas';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  return withAdmin(request, async () => {
    const id = parseId((await params).id);
    if (id === null) return error('Invalid id', 400);

    const project = await projectService.getById(id);
    return project ? json({ project }) : error('Project not found', 404);
  });
}

export async function PUT(request: Request, { params }: Params) {
  return withAdmin(request, async () => {
    const id = parseId((await params).id);
    if (id === null) return error('Invalid id', 400);

    const parsed = await parseBody(request, projectSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    const updated = await projectService.update(id, {
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

    return updated ? json({ project: updated }) : error('Project not found', 404);
  });
}

export async function DELETE(request: Request, { params }: Params) {
  return withAdmin(request, async () => {
    const id = parseId((await params).id);
    if (id === null) return error('Invalid id', 400);

    const deleted = await projectService.remove(id);
    return deleted ? json({ deleted: true }) : error('Project not found', 404);
  });
}
