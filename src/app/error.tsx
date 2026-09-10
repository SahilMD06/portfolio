'use client';

import { useEffect } from 'react';

import { Button, Container } from '@/components/ui';

/**
 * Route-level error boundary. It shows a recovery action and never renders the
 * error message or stack, which could leak internals to a visitor.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled route error:', error);
  }, [error]);

  return (
    <main id="main" className="flex min-h-dvh items-center">
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-semibold sm:text-3xl">Something went wrong</h1>
        <p className="mx-auto mt-3 max-w-md text-fg-muted">
          This section failed to load. Trying again usually fixes it.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-fg-subtle">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-7 flex justify-center">
          <Button onClick={reset}>Try again</Button>
        </div>
      </Container>
    </main>
  );
}
