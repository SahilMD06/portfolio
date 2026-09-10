import { AdminList, AdminPageHeader, type ListItem } from '@/components/admin/list';
import { deleteCertification, reorderCertifications } from '@/lib/actions/admin';
import { requireAdminPage } from '@/lib/auth/guard';
import { certificationService } from '@/lib/services/entities';
import { formatPartialDate } from '@/lib/utils';

export const metadata = { title: 'Certifications' };

export default async function AdminCertificationsPage() {
  await requireAdminPage();
  const items = await certificationService.list();

  const rows: ListItem[] = items.map((item) => ({
    id: item.id,
    title: item.name,
    subtitle: item.issuer,
    meta: [formatPartialDate(item.issueDate), item.credentialId].filter(Boolean).join('  ·  '),
  }));

  return (
    <>
      <AdminPageHeader
        title="Certifications"
        actionHref="/admin/certifications/new"
        actionLabel="Add certification"
      />
      <AdminList
        items={rows}
        basePath="/admin/certifications"
        entityLabel="Certification"
        onReorder={reorderCertifications}
        onDelete={deleteCertification}
        emptyTitle="No certifications added yet"
      />
    </>
  );
}
