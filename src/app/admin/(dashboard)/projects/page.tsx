import { AdminList, AdminPageHeader, type ListItem } from '@/components/admin/list';
import { deleteProject, reorderProjects } from '@/lib/actions/admin';
import { requireAdminPage } from '@/lib/auth/guard';
import { projectService } from '@/lib/services/entities';
import { formatDateRange } from '@/lib/utils';

export const metadata = { title: 'Projects' };

export default async function AdminProjectsPage() {
  await requireAdminPage();
  const projects = await projectService.list();

  const items: ListItem[] = projects.map((project) => ({
    id: project.id,
    title: project.title,
    subtitle: project.summary || undefined,
    meta: [
      `/projects/${project.slug}`,
      formatDateRange(project.startDate, project.endDate),
      project.technologies.slice(0, 4).join(', '),
    ]
      .filter(Boolean)
      .join('  ·  '),
    badges: [
      ...(project.featured ? [{ label: 'Featured', tone: 'accent' as const }] : []),
      ...(project.published
        ? []
        : [{ label: 'Draft', tone: 'danger' as const }]),
    ],
  }));

  return (
    <>
      <AdminPageHeader
        title="Projects"
        description="Featured projects appear on the homepage; all published projects appear at /projects."
        actionHref="/admin/projects/new"
        actionLabel="New project"
      />

      <AdminList
        items={items}
        basePath="/admin/projects"
        entityLabel="Project"
        onReorder={reorderProjects}
        onDelete={deleteProject}
        emptyTitle="No projects yet"
        emptyDescription="Add your first project and it will appear on your portfolio immediately."
      />
    </>
  );
}
