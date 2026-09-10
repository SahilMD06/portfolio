import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SocialLinkForm } from '@/components/admin/forms/simple-forms';
import { requireAdminPage } from '@/lib/auth/guard';
import { socialLinkService } from '@/lib/services/entities';

export const metadata = { title: 'Edit link' };

export default async function SocialLinkEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const isNew = id === 'new';

  const item = isNew ? null : await socialLinkService.getById(Number(id));
  if (!isNew && !item) notFound();

  return (
    <>
      <header className="mb-6">
        <Link href="/admin/social-links" className="text-sm text-fg-subtle hover:text-fg">
          ← Social links
        </Link>
        <h1 className="mt-2 text-xl font-semibold">
          {isNew ? 'Add link' : `Edit ${item?.label}`}
        </h1>
      </header>

      <SocialLinkForm item={item} />
    </>
  );
}
