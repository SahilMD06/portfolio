import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EducationForm } from '@/components/admin/forms/simple-forms';
import { requireAdminPage } from '@/lib/auth/guard';
import { educationService } from '@/lib/services/entities';

export const metadata = { title: 'Edit education' };

export default async function EducationEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const isNew = id === 'new';

  const item = isNew ? null : await educationService.getById(Number(id));
  if (!isNew && !item) notFound();

  return (
    <>
      <header className="mb-6">
        <Link href="/admin/education" className="text-sm text-fg-subtle hover:text-fg">
          ← Education
        </Link>
        <h1 className="mt-2 text-xl font-semibold">
          {isNew ? 'Add education' : `Edit ${item?.institution}`}
        </h1>
      </header>

      <EducationForm item={item} />
    </>
  );
}
