import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SkillCategoryForm } from '@/components/admin/forms/simple-forms';
import { requireAdminPage } from '@/lib/auth/guard';
import { skillCategoryService } from '@/lib/services/entities';

export const metadata = { title: 'Edit skill category' };

/**
 * Sits at /admin/skills/categories/[id]. The static `categories` segment takes
 * priority over the sibling /admin/skills/[id] dynamic route, so there is no
 * ambiguity between a category id and a skill id.
 */
export default async function SkillCategoryEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const isNew = id === 'new';

  const item = isNew ? null : await skillCategoryService.getById(Number(id));
  if (!isNew && !item) notFound();

  return (
    <>
      <header className="mb-6">
        <Link href="/admin/skills" className="text-sm text-fg-subtle hover:text-fg">
          ← Skills
        </Link>
        <h1 className="mt-2 text-xl font-semibold">
          {isNew ? 'New category' : `Edit ${item?.name}`}
        </h1>
      </header>

      <SkillCategoryForm item={item} />
    </>
  );
}
