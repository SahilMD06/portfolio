'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useId, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui';
import { AlertIcon } from '@/components/ui/icons';
import type { ActionResult } from '@/lib/actions/types';
import { cn } from '@/lib/utils';
import { useToast } from './toast';

/**
 * Form primitives shared by every admin editor.
 *
 * Each field renders its own label, hint and error, wired together with
 * aria-describedby / aria-invalid so validation is announced to screen readers
 * rather than only shown in red.
 */

const FIELD_CLASS =
  'w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg ' +
  'placeholder:text-fg-subtle transition-colors duration-150 focus:border-accent ' +
  'disabled:opacity-60';

interface BaseFieldProps {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

function FieldWrapper({
  id,
  label,
  hint,
  error,
  required,
  children,
}: BaseFieldProps & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {required ? (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
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

export function TextField({
  type = 'text',
  defaultValue,
  placeholder,
  maxLength,
  ...field
}: BaseFieldProps & {
  type?: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <FieldWrapper {...field} id={id}>
      <input
        id={id}
        name={field.name}
        type={type}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        maxLength={maxLength}
        required={field.required}
        aria-invalid={field.error ? true : undefined}
        aria-describedby={field.error ? `${id}-error` : field.hint ? `${id}-hint` : undefined}
        className={cn(FIELD_CLASS, field.error && 'border-danger')}
      />
    </FieldWrapper>
  );
}

export function TextAreaField({
  defaultValue,
  rows = 5,
  placeholder,
  maxLength,
  ...field
}: BaseFieldProps & {
  defaultValue?: string | null;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <FieldWrapper {...field} id={id}>
      <textarea
        id={id}
        name={field.name}
        rows={rows}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        maxLength={maxLength}
        required={field.required}
        aria-invalid={field.error ? true : undefined}
        aria-describedby={field.error ? `${id}-error` : field.hint ? `${id}-hint` : undefined}
        className={cn(FIELD_CLASS, 'resize-y', field.error && 'border-danger')}
      />
    </FieldWrapper>
  );
}

export function SelectField({
  defaultValue,
  options,
  ...field
}: BaseFieldProps & {
  defaultValue?: string | number | null;
  options: { value: string | number; label: string }[];
}) {
  const id = useId();
  return (
    <FieldWrapper {...field} id={id}>
      <select
        id={id}
        name={field.name}
        defaultValue={defaultValue ?? ''}
        required={field.required}
        aria-invalid={field.error ? true : undefined}
        aria-describedby={field.error ? `${id}-error` : field.hint ? `${id}-hint` : undefined}
        className={cn(FIELD_CLASS, field.error && 'border-danger')}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-2.5">
      {/*
        An unchecked box submits nothing, so a hidden "false" is sent first.
        The checkbox appears later in the FormData and wins when checked.
      */}
      <input type="hidden" name={name} value="false" />
      <input
        id={id}
        name={name}
        type="checkbox"
        value="true"
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-strong accent-accent"
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint ? (
          <p id={`${id}-hint`} className="text-xs text-fg-subtle">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Form shell                                                                 */
/* -------------------------------------------------------------------------- */

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description ? <p className="mt-1 text-xs text-fg-subtle">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  );
}

/**
 * Wraps an entity editor: runs the server action, shows a toast, and navigates
 * back to the list on success so the saved row is visible immediately.
 */
export function EntityForm({
  action,
  id,
  cancelHref,
  submitLabel = 'Save',
  redirectOnSuccess = true,
  children,
  footer,
}: {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  /** Existing row id; omit or 0 to create. */
  id?: number;
  cancelHref?: string;
  submitLabel?: string;
  redirectOnSuccess?: boolean;
  children: (errors: Record<string, string>) => ReactNode;
  footer?: ReactNode;
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(action, { ok: false });
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!state.message) return;
    toast(state.ok ? 'success' : 'error', state.message);
    if (state.ok) {
      // Refresh so any list behind this form reflects the write.
      router.refresh();
      if (redirectOnSuccess && cancelHref) router.push(cancelHref);
    }
    // `state` is a fresh object per submission, so this runs once per result.
  }, [state, toast, router, redirectOnSuccess, cancelHref]);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {id ? <input type="hidden" name="id" value={id} /> : null}

      {state.message && !state.ok ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-border bg-danger-subtle p-3"
        >
          <AlertIcon width="16" height="16" className="mt-0.5 shrink-0 text-danger" />
          <p className="text-sm">{state.message}</p>
        </div>
      ) : null}

      {children(errors)}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-5">
        <SaveButton label={submitLabel} />
        {cancelHref ? (
          <Link
            href={cancelHref}
            className="inline-flex h-10 items-center rounded-lg border border-border-strong bg-surface px-4 text-sm hover:bg-surface-2"
          >
            Cancel
          </Link>
        ) : null}
        <div className="ml-auto">{footer}</div>
      </div>
    </form>
  );
}
