'use client';

import { useActionState, useEffect, useId, useRef } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui';
import { AlertIcon } from '@/components/ui/icons';
import { changePassword } from '@/lib/actions/auth';
import type { ActionResult } from '@/lib/actions/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/admin/toast';

const FIELD_CLASS =
  'w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg ' +
  'transition-colors duration-150 focus:border-accent';

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? 'Changing…' : 'Change password'}
    </Button>
  );
}

function PasswordField({
  name,
  label,
  hint,
  error,
  autoComplete,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  autoComplete: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="password"
        required
        autoComplete={autoComplete}
        maxLength={200}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(FIELD_CLASS, error && 'border-danger')}
      />
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState<ActionResult, FormData>(changePassword, { ok: false });
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.message) return;
    toast(state.ok ? 'success' : 'error', state.message);
    // Never leave passwords sitting in the DOM after a successful change.
    if (state.ok) formRef.current?.reset();
  }, [state, toast]);

  const errors = state.fieldErrors ?? {};

  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold">Account security</h2>
      <p className="mt-1 text-xs text-fg-subtle">
        Changing your password signs out every other device. You will stay signed in here.
      </p>

      <form ref={formRef} action={formAction} className="mt-4 max-w-md space-y-4" noValidate>
        {state.message && !state.ok ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-border bg-danger-subtle p-3"
          >
            <AlertIcon width="16" height="16" className="mt-0.5 shrink-0 text-danger" />
            <p className="text-sm">{state.message}</p>
          </div>
        ) : null}

        <PasswordField
          name="currentPassword"
          label="Current password"
          error={errors.currentPassword}
          autoComplete="current-password"
        />
        <PasswordField
          name="newPassword"
          label="New password"
          hint="At least 12 characters."
          error={errors.newPassword}
          autoComplete="new-password"
        />
        <PasswordField
          name="confirmPassword"
          label="Confirm new password"
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <SaveButton />
      </form>
    </section>
  );
}
