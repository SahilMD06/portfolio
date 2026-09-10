import { AdminList, AdminPageHeader, type ListItem } from '@/components/admin/list';
import { deleteEducation, reorderEducation } from '@/lib/actions/admin';
import { requireAdminPage } from '@/lib/auth/guard';
import { educationService } from '@/lib/services/entities';
import { formatDateRange } from '@/lib/utils';

export const metadata = { title: 'Education' };

export default async function AdminEducationPage() {
  await requireAdminPage();
  const items = await educationService.list();

  const rows: ListItem[] = items.map((item) => ({
    id: item.id,
    title: item.institution,
    subtitle: [item.degree, item.field].filter(Boolean).join(' · '),
    meta: [formatDateRange(item.startDate, item.endDate), item.grade].filter(Boolean).join('  ·  '),
  }));

  return (
    <>
      <AdminPageHeader
        title="Education"
        actionHref="/admin/education/new"
        actionLabel="Add education"
      />
      <AdminList
        items={rows}
        basePath="/admin/education"
        entityLabel="Education entry"
        onReorder={reorderEducation}
        onDelete={deleteEducation}
        emptyTitle="No education added yet"
      />
    </>
  );
}
