import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SkillForm } from '@/components/admin/forms/simple-forms';
import { requireAdminPage } from '@/lib/auth/guard';
import { skillCategoryService, skillService } from '@/lib/services/entities';

export const metadata = { title: 'Edit skill' };

export default async function SkillEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const isNew = id === 'new';

  const [item, categories] = await Promise.all([
    isNew ? Promise.resolve(null) : skillService.getById(Number(id)),
    skillCategoryService.list(),
  ]);
  if (!isNew && !item) notFound();

  return (
    <>
      <header className="mb-6">
        <Link href="/admin/skills" className="text-sm text-fg-subtle hover:text-fg">
          ← Skills
        </Link>
        <h1 className="mt-2 text-xl font-semibold">
          {isNew ? 'Add skill' : `Edit ${item?.name}`}
        </h1>
      </header>

      <SkillForm item={item} categories={categories} />
    </>
  );
}
