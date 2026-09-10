import Link from 'next/link';

import { Container, LinkButton } from '@/components/ui';

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh items-center">
      <Container className="py-20 text-center">
        <p className="font-mono text-sm text-accent">404</p>
        <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">Page not found</h1>
        <p className="mx-auto mt-3 max-w-md text-fg-muted">
          That page does not exist, or it may have been moved.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <LinkButton href="/">Back to home</LinkButton>
          <Link
            href="/projects"
            className="inline-flex h-10 items-center rounded-lg px-4 text-sm text-fg-muted hover:text-fg"
          >
            Browse projects
          </Link>
        </div>
      </Container>
    </main>
  );
}
