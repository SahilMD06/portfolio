'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import { Button } from '@/components/ui';
import { TrashIcon } from '@/components/ui/icons';
import { useToast } from './toast';
import type { ActionResult } from '@/lib/actions/types';

/**
 * Delete with a real confirmation step.
 *
 * Uses <dialog showModal()> so the browser provides the focus trap, Escape
 * handling, inert background and correct ARIA semantics — no dialog library and
 * no hand-rolled focus management to get wrong.
 */
export function ConfirmDelete({
  label,
  itemName,
  action,
  onDeleted,
  size = 'sm',
}: {
  /** Accessible name for the trigger, e.g. "Delete project". */
  label: string;
  /** Shown in the confirmation question, e.g. "ShopFlow". */
  itemName: string;
  action: () => Promise<ActionResult>;
  onDeleted?: () => void;
  size?: 'sm' | 'md';
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function confirm() {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast('success', result.message ?? `${itemName} deleted.`);
        setOpen(false);
        onDeleted?.();
      } else {
        toast('error', result.message ?? 'Could not delete. Please try again.');
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={size}
        onClick={() => setOpen(true)}
        aria-label={`${label}: ${itemName}`}
        className="text-fg-subtle hover:bg-danger-subtle hover:text-danger"
      >
        <TrashIcon width="15" height="15" />
        <span className="sr-only sm:not-sr-only">Delete</span>
      </Button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        // Clicking the backdrop (the dialog element itself) closes it.
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
        className="m-auto w-[calc(100vw-2rem)] max-w-md rounded-card border border-border bg-surface p-0 text-fg backdrop:bg-black/50"
      >
        <div className="p-5" onClick={(event) => event.stopPropagation()}>
          <h2 className="text-base font-semibold">Delete {itemName}?</h2>
          <p className="mt-2 text-sm text-fg-muted">
            This permanently removes it from the database and the public portfolio. This cannot be
            undone.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={confirm} disabled={pending}>
              {pending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
