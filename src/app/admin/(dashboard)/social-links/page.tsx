import { AdminList, AdminPageHeader, type ListItem } from '@/components/admin/list';
import { deleteSocialLink, reorderSocialLinks } from '@/lib/actions/admin';
import { requireAdminPage } from '@/lib/auth/guard';
import { socialLinkService } from '@/lib/services/entities';

export const metadata = { title: 'Social links' };

export default async function AdminSocialLinksPage() {
  await requireAdminPage();
  const items = await socialLinkService.list();

  const rows: ListItem[] = items.map((item) => ({
    id: item.id,
    title: item.label,
    meta: item.url,
    badges: item.visible ? [] : [{ label: 'Hidden', tone: 'danger' as const }],
  }));

  return (
    <>
      <AdminPageHeader
        title="Social links"
        description="Shown in the hero, contact section and footer."
        actionHref="/admin/social-links/new"
        actionLabel="Add link"
      />
      <AdminList
        items={rows}
        basePath="/admin/social-links"
        entityLabel="Link"
        onReorder={reorderSocialLinks}
        onDelete={deleteSocialLink}
        emptyTitle="No links added yet"
        emptyDescription="Add your GitHub, LinkedIn and email."
      />
    </>
  );
}
