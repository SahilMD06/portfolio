import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AchievementForm } from '@/components/admin/forms/simple-forms';
import { requireAdminPage } from '@/lib/auth/guard';
import { achievementService } from '@/lib/services/entities';
import { toMediaOption } from '@/lib/services/media';

export const metadata = { title: 'Edit achievement' };

export default async function AchievementEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const isNew = id === 'new';

  const item = isNew ? null : await achievementService.getById(Number(id));
  if (!isNew && !item) notFound();

  const file = await toMediaOption(item?.mediaId);

  return (
    <>
      <header className="mb-6">
        <Link href="/admin/achievements" className="text-sm text-fg-subtle hover:text-fg">
          ← Achievements
        </Link>
        <h1 className="mt-2 text-xl font-semibold">
          {isNew ? 'Add achievement' : `Edit ${item?.title}`}
        </h1>
      </header>

      <AchievementForm item={item} file={file} />
    </>
  );
}
