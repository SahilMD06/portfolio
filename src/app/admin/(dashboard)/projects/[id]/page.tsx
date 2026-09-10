import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProjectForm } from '@/components/admin/forms/project-form';
import { requireAdminPage } from '@/lib/auth/guard';
import { projectService } from '@/lib/services/entities';
import { getMedia, mediaUrl } from '@/lib/services/media';
import type { MediaOption } from '@/components/admin/media-picker';

export const metadata = { title: 'Edit project' };

/**
 * One route serves both create and edit: `/admin/projects/new` renders an empty
 * form, `/admin/projects/12` loads that row. Keeps a single form implementation.
 */
export default async function ProjectEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const isNew = id === 'new';

  const project = isNew ? null : await projectService.getById(Number(id));
  if (!isNew && !project) notFound();

  let image: MediaOption | null = null;
  if (project?.imageMediaId) {
    const file = await getMedia(project.imageMediaId);
    if (file) {
      image = {
        id: file.id,
        filename: file.filename,
        mimeType: file.mimeType,
        url: mediaUrl(file) ?? `/media/${file.id}`,
      };
    }
  }

  return (
    <>
      <header className="mb-6">
        <Link href="/admin/projects" className="text-sm text-fg-subtle hover:text-fg">
          ← Projects
        </Link>
        <h1 className="mt-2 text-xl font-semibold">
          {isNew ? 'New project' : `Edit ${project?.title}`}
        </h1>
      </header>

      <ProjectForm project={project} image={image} />
    </>
  );
}
