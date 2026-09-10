import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CertificationForm } from '@/components/admin/forms/simple-forms';
import { requireAdminPage } from '@/lib/auth/guard';
import { certificationService } from '@/lib/services/entities';
import { toMediaOption } from '@/lib/services/media';

export const metadata = { title: 'Edit certification' };

export default async function CertificationEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const isNew = id === 'new';

  const item = isNew ? null : await certificationService.getById(Number(id));
  if (!isNew && !item) notFound();

  const file = await toMediaOption(item?.mediaId);

  return (
    <>
      <header className="mb-6">
        <Link href="/admin/certifications" className="text-sm text-fg-subtle hover:text-fg">
          ← Certifications
        </Link>
        <h1 className="mt-2 text-xl font-semibold">
          {isNew ? 'Add certification' : `Edit ${item?.name}`}
        </h1>
      </header>

      <CertificationForm item={item} file={file} />
    </>
  );
}
