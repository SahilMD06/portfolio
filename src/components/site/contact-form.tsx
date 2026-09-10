'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui';
import { AlertIcon, CheckIcon } from '@/components/ui/icons';
import { submitContactMessage, type ContactFormState } from '@/lib/actions/contact';
import { cn } from '@/lib/utils';

const INITIAL: ContactFormState = { status: 'idle' };

const fieldClass =
  'w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-subtle ' +
  'transition-colors duration-150 focus:border-accent';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? 'Sending…' : 'Send message'}
    </Button>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-danger">
      {message}
    </p>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactMessage, INITIAL);
  const errors = state.fieldErrors ?? {};

  if (state.status === 'success') {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-card border border-border bg-success-subtle p-5"
      >
        <CheckIcon width="18" height="18" className="mt-0.5 shrink-0 text-success" />
        <div>
          <p className="text-sm font-medium">Message sent</p>
          <p className="mt-1 text-sm text-fg-muted">{state.message}</p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.status === 'error' && state.message ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-border bg-danger-subtle p-3"
        >
          <AlertIcon width="16" height="16" className="mt-0.5 shrink-0 text-danger" />
          <p className="text-sm text-fg">{state.message}</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium">
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            maxLength={160}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            className={cn(fieldClass, errors.name && 'border-danger')}
          />
          <FieldError id="contact-name-error" message={errors.name} />
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={255}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            className={cn(fieldClass, errors.email && 'border-danger')}
          />
          <FieldError id="contact-email-error" message={errors.email} />
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          maxLength={5000}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          className={cn(fieldClass, 'resize-y', errors.message && 'border-danger')}
        />
        <FieldError id="contact-message-error" message={errors.message} />
      </div>

      {/*
        Honeypot. Hidden from sighted users and from assistive technology, so
        only an automated form-filler will populate it.
      */}
      <div className="absolute h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <SubmitButton />
    </form>
  );
}
