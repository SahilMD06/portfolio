import type { Metadata } from 'next';

import { Container, LinkButton } from '@/components/ui';

/**
 * Shown when `notFound()` is called for an unknown or unpublished project slug.
 *
 * Note: this route currently responds 200 rather than 404 (see the comment on
 * `dynamic` in page.tsx). `noindex` here and in the page's generateMetadata
 * ensures search engines do not index these URLs regardless.
 */
export const metadata: Metadata = {
  title: 'Project not found',
  robots: { index: false, follow: false },
};

export default function ProjectNotFound() {
  return (
    <main id="main" className="flex min-h-dvh items-center">
      <Container className="py-20 text-center">
        <p className="font-mono text-sm text-accent">404</p>
        <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">Project not found</h1>
        <p className="mx-auto mt-3 max-w-md text-fg-muted">
          This project does not exist, or it is no longer published.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <LinkButton href="/projects">Browse all projects</LinkButton>
          <LinkButton href="/" variant="secondary">
            Back to home
          </LinkButton>
        </div>
      </Container>
    </main>
  );
}
