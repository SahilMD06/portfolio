import Link from 'next/link';

import { SkillsManager } from '@/components/admin/skills-manager';
import { AdminPageHeader } from '@/components/admin/list';
import { requireAdminPage } from '@/lib/auth/guard';
import { skillCategoryService, skillService } from '@/lib/services/entities';

export const metadata = { title: 'Skills' };

export default async function AdminSkillsPage() {
  await requireAdminPage();
  const [categories, skills] = await Promise.all([
    skillCategoryService.list(),
    skillService.list(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Skills"
        description="Skills are grouped by category on the public site."
        actionHref="/admin/skills/new"
        actionLabel="Add skill"
      />

      {categories.length === 0 ? (
        <div className="rounded-card border border-dashed border-border-strong bg-surface px-6 py-10 text-center">
          <p className="font-medium">Create a category first</p>
          <p className="mt-1 text-sm text-fg-muted">
            Skills belong to a category, such as Programming or Tools.
          </p>
          <Link
            href="/admin/skills/categories/new"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent-hover"
          >
            New category
          </Link>
        </div>
      ) : (
        <SkillsManager categories={categories} skills={skills} />
      )}
    </>
  );
}
