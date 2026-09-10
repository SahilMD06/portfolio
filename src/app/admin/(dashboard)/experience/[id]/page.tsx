import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ExperienceForm } from '@/components/admin/forms/experience-form';
import { requireAdminPage } from '@/lib/auth/guard';
import { experienceService } from '@/lib/services/entities';
import { toMediaOption } from '@/lib/services/media';

export const metadata = { title: 'Edit experience' };

export default async function ExperienceEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const isNew = id === 'new';

  const item = isNew ? null : await experienceService.getById(Number(id));
  if (!isNew && !item) notFound();

  const [logo, document] = await Promise.all([
    toMediaOption(item?.logoMediaId),
    toMediaOption(item?.documentMediaId),
  ]);

  return (
    <>
      <header className="mb-6">
        <Link href="/admin/experience" className="text-sm text-fg-subtle hover:text-fg">
          ← Experience
        </Link>
        <h1 className="mt-2 text-xl font-semibold">
          {isNew ? 'Add experience' : `Edit ${item?.role}`}
        </h1>
      </header>

      <ExperienceForm experience={item} logo={logo} document={document} />
    </>
  );
}
