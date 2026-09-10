'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Badge, Card } from '@/components/ui';
import { DownIcon, PencilIcon, PlusIcon, UpIcon } from '@/components/ui/icons';
import { deleteSkill, deleteSkillCategory, reorderSkills } from '@/lib/actions/admin';
import type { Skill, SkillCategory } from '@/lib/db/schema';
import { ConfirmDelete } from './confirm-delete';
import { useToast } from './toast';

/**
 * Skills grouped by category, with reordering scoped to each category so a
 * skill never jumps between groups when moved.
 */
export function SkillsManager({
  categories,
  skills,
}: {
  categories: SkillCategory[];
  skills: Skill[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function move(categorySkills: Skill[], index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= categorySkills.length) return;

    const ids = categorySkills.map((skill) => skill.id);
    const moved = ids[index];
    const displaced = ids[target];
    if (moved === undefined || displaced === undefined) return;
    ids[index] = displaced;
    ids[target] = moved;

    startTransition(async () => {
      const result = await reorderSkills(ids);
      if (result.ok) router.refresh();
      else toast('error', result.message ?? 'Could not reorder.');
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Link
          href="/admin/skills/categories/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 text-sm hover:bg-surface-2"
        >
          <PlusIcon width="15" height="15" />
          New category
        </Link>
      </div>

      {categories.map((category) => {
        const categorySkills = skills
          .filter((skill) => skill.categoryId === category.id)
          .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);

        return (
          <Card key={category.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h2 className="text-sm font-semibold">{category.name}</h2>
                <p className="font-mono text-xs text-fg-subtle">{category.slug}</p>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/skills/categories/${category.id}`}
                  aria-label={`Edit category ${category.name}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
                >
                  <PencilIcon width="15" height="15" />
                  Edit
                </Link>
                <ConfirmDelete
                  label="Delete category"
                  itemName={`${category.name} (and its ${categorySkills.length} skill${categorySkills.length === 1 ? '' : 's'})`}
                  action={() => deleteSkillCategory(category.id)}
                  onDeleted={() => router.refresh()}
                />
              </div>
            </div>

            {categorySkills.length === 0 ? (
              <p className="py-4 text-sm text-fg-subtle">No skills in this category yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {categorySkills.map((skill, index) => (
                  <li key={skill.id} className="flex items-center gap-2 py-2">
                    <div className="flex shrink-0 flex-col">
                      <button
                        type="button"
                        onClick={() => move(categorySkills, index, -1)}
                        disabled={index === 0 || pending}
                        aria-label={`Move ${skill.name} up`}
                        className="rounded p-0.5 text-fg-subtle hover:text-fg disabled:opacity-30"
                      >
                        <UpIcon width="14" height="14" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(categorySkills, index, 1)}
                        disabled={index === categorySkills.length - 1 || pending}
                        aria-label={`Move ${skill.name} down`}
                        className="rounded p-0.5 text-fg-subtle hover:text-fg disabled:opacity-30"
                      >
                        <DownIcon width="14" height="14" />
                      </button>
                    </div>

                    <span className="flex-1 text-sm">{skill.name}</span>

                    {skill.featured ? <Badge tone="accent">Featured</Badge> : null}
                    {skill.visible ? null : <Badge tone="danger">Hidden</Badge>}

                    <Link
                      href={`/admin/skills/${skill.id}`}
                      aria-label={`Edit ${skill.name}`}
                      className="inline-flex h-8 items-center rounded-lg px-2 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
                    >
                      <PencilIcon width="15" height="15" />
                    </Link>
                    <ConfirmDelete
                      label="Delete skill"
                      itemName={skill.name}
                      action={() => deleteSkill(skill.id)}
                      onDeleted={() => router.refresh()}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}
