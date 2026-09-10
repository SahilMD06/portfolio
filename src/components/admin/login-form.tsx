'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui';
import { AlertIcon } from '@/components/ui/icons';
import { login, type LoginState } from '@/lib/actions/auth';

const fieldClass =
  'w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg ' +
  'transition-colors duration-150 focus:border-accent';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending} aria-disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-border bg-danger-subtle p-3"
        >
          <AlertIcon width="16" height="16" className="mt-0.5 shrink-0 text-danger" />
          <p className="text-sm">{state.error}</p>
        </div>
      ) : null}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={fieldClass}
        />
      </div>

      <SubmitButton />
    </form>
  );
}
