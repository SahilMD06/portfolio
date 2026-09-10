'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition, type ReactNode } from 'react';

import { Badge, Button, EmptyState, LinkButton } from '@/components/ui';
import { DownIcon, PencilIcon, PlusIcon, UpIcon } from '@/components/ui/icons';
import type { ActionResult } from '@/lib/actions/types';
import { ConfirmDelete } from './confirm-delete';
import { useToast } from './toast';

export interface ListItem {
  id: number;
  title: string;
  subtitle?: string;
  meta?: string;
  badges?: { label: string; tone?: 'default' | 'accent' | 'success' | 'danger' }[];
}

/**
 * Reusable admin list: rows with reordering, edit and delete.
 *
 * Ordering uses explicit Move up / Move down buttons rather than drag and drop.
 * They are keyboard operable and work on touch without a gesture library — for
 * a list of this size that is strictly better than a drag implementation.
 */
export function AdminList({
  items,
  basePath,
  entityLabel,
  onReorder,
  onDelete,
  emptyTitle,
  emptyDescription,
  extraActions,
}: {
  items: ListItem[];
  /** e.g. "/admin/projects" — edit links become `${basePath}/${id}`. */
  basePath: string;
  entityLabel: string;
  onReorder?: (ids: number[]) => Promise<ActionResult>;
  onDelete: (id: number) => Promise<ActionResult>;
  emptyTitle: string;
  emptyDescription?: string;
  extraActions?: (item: ListItem) => ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function move(index: number, direction: -1 | 1) {
    if (!onReorder) return;
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const ids = items.map((item) => item.id);
    const moved = ids[index];
    const displaced = ids[target];
    if (moved === undefined || displaced === undefined) return;
    ids[index] = displaced;
    ids[target] = moved;

    startTransition(async () => {
      const result = await onReorder(ids);
      if (result.ok) router.refresh();
      else toast('error', result.message ?? 'Could not reorder.');
    });
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          <LinkButton href={`${basePath}/new`}>
            <PlusIcon width="16" height="16" />
            Add {entityLabel.toLowerCase()}
          </LinkButton>
        }
      />
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface p-3 sm:flex-nowrap"
        >
          {onReorder ? (
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0 || pending}
                aria-label={`Move ${item.title} up`}
                className="rounded p-0.5 text-fg-subtle hover:text-fg disabled:opacity-30"
              >
                <UpIcon width="15" height="15" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1 || pending}
                aria-label={`Move ${item.title} down`}
                className="rounded p-0.5 text-fg-subtle hover:text-fg disabled:opacity-30"
              >
                <DownIcon width="15" height="15" />
              </button>
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`${basePath}/${item.id}`}
                className="truncate text-sm font-medium hover:text-accent"
              >
                {item.title}
              </Link>
              {item.badges?.map((badge) => (
                <Badge key={badge.label} tone={badge.tone}>
                  {badge.label}
                </Badge>
              ))}
            </div>
            {item.subtitle ? (
              <p className="mt-0.5 truncate text-xs text-fg-muted">{item.subtitle}</p>
            ) : null}
            {item.meta ? (
              <p className="mt-0.5 font-mono text-[0.7rem] text-fg-subtle">{item.meta}</p>
            ) : null}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            {extraActions?.(item)}
            <Link
              href={`${basePath}/${item.id}`}
              aria-label={`Edit ${item.title}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
            >
              <PencilIcon width="15" height="15" />
              <span className="sr-only sm:not-sr-only">Edit</span>
            </Link>
            <ConfirmDelete
              label={`Delete ${entityLabel.toLowerCase()}`}
              itemName={item.title}
              action={() => onDelete(item.id)}
              onDeleted={() => router.refresh()}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Standard header for an admin list page. */
export function AdminPageHeader({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {description ? <p className="mt-1 text-sm text-fg-muted">{description}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <LinkButton href={actionHref}>
          <PlusIcon width="16" height="16" />
          {actionLabel}
        </LinkButton>
      ) : null}
    </header>
  );
}

/** Small inline button used for one-off row actions. */
export function RowAction({
  onClick,
  children,
  label,
}: {
  onClick: () => void;
  children: ReactNode;
  label: string;
}) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick} aria-label={label}>
      {children}
    </Button>
  );
}
