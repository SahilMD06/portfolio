import { AdminList, AdminPageHeader, type ListItem } from '@/components/admin/list';
import { deleteAchievement, reorderAchievements } from '@/lib/actions/admin';
import { requireAdminPage } from '@/lib/auth/guard';
import { achievementService } from '@/lib/services/entities';
import { formatPartialDate } from '@/lib/utils';

export const metadata = { title: 'Achievements' };

export default async function AdminAchievementsPage() {
  await requireAdminPage();
  const items = await achievementService.list();

  const rows: ListItem[] = items.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.organization || undefined,
    meta: formatPartialDate(item.date),
  }));

  return (
    <>
      <AdminPageHeader
        title="Achievements"
        actionHref="/admin/achievements/new"
        actionLabel="Add achievement"
      />
      <AdminList
        items={rows}
        basePath="/admin/achievements"
        entityLabel="Achievement"
        onReorder={reorderAchievements}
        onDelete={deleteAchievement}
        emptyTitle="No achievements added yet"
      />
    </>
  );
}
