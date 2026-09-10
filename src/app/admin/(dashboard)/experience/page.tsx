import { AdminList, AdminPageHeader, type ListItem } from '@/components/admin/list';
import { deleteExperience, reorderExperiences } from '@/lib/actions/admin';
import { requireAdminPage } from '@/lib/auth/guard';
import { experienceService } from '@/lib/services/entities';
import { formatDateRange } from '@/lib/utils';

export const metadata = { title: 'Experience' };

export default async function AdminExperiencePage() {
  await requireAdminPage();
  const items = await experienceService.list();

  const rows: ListItem[] = items.map((item) => ({
    id: item.id,
    title: `${item.role} — ${item.company}`,
    subtitle: item.description || undefined,
    meta: [
      formatDateRange(item.startDate, item.endDate, item.isCurrent),
      item.employmentType,
      item.location,
    ]
      .filter(Boolean)
      .join('  ·  '),
    badges: [
      ...(item.isCurrent ? [{ label: 'Current', tone: 'success' as const }] : []),
      ...(item.published ? [] : [{ label: 'Hidden', tone: 'danger' as const }]),
    ],
  }));

  return (
    <>
      <AdminPageHeader
        title="Experience"
        description="Internships and roles, shown as a timeline on your portfolio."
        actionHref="/admin/experience/new"
        actionLabel="Add experience"
      />
      <AdminList
        items={rows}
        basePath="/admin/experience"
        entityLabel="Experience"
        onReorder={reorderExperiences}
        onDelete={deleteExperience}
        emptyTitle="No experience added yet"
        emptyDescription="Add your internships and roles here."
      />
    </>
  );
}
