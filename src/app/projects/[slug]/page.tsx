import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { Badge, Container, LinkButton, TechChip } from '@/components/ui';
import { ArrowLeftIcon, ExternalIcon, GithubIcon } from '@/components/ui/icons';
import { env } from '@/lib/env';
import { getProfile, getProjectBySlug } from '@/lib/services/content';
import { mediaUrl } from '@/lib/services/media';
import { formatDateRange, toParagraphs } from '@/lib/utils';

/**
 * Rendered per request so a project published or edited in /admin appears
 * immediately. The underlying queries are still cached by tag (lib/cache.ts),
 * so a request for a real project normally does no database work.
 *
 * Known issue: an unknown slug renders the not-found UI but responds 200 rather
 * than 404. Identical code at a different route path returns 404 correctly, so
 * this appears to be a Next 16 route-state quirk rather than a bug in this
 * page; `dynamic`, `revalidate`, metadata-level notFound(), and a segment-level
 * not-found boundary were all tried without effect. Both this page's metadata
 * and not-found.tsx set `robots: noindex`, so these URLs are never indexed.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: 'Project not found', robots: { index: false, follow: false } };

  const image = mediaUrl(project.image);
  const description = project.summary || `${project.title} — a project by Neel Khandelwal.`;

  return {
    title: project.title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: 'article',
      title: project.title,
      description,
      url: `${env.siteUrl}/projects/${project.slug}`,
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: project.title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [profile, project] = await Promise.all([getProfile(), getProjectBySlug(slug)]);

  if (!project) notFound();

  const cover = mediaUrl(project.image);
  const paragraphs = toParagraphs(project.description);
  const dateRange = formatDateRange(project.startDate, project.endDate);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.summary || undefined,
    author: { '@type': 'Person', name: profile.fullName },
    url: `${env.siteUrl}/projects/${project.slug}`,
    keywords: project.technologies.join(', ') || undefined,
    ...(project.githubUrl ? { codeRepository: project.githubUrl } : {}),
  };

  return (
    <>
      <SiteHeader name={profile.fullName} />

      <main id="main">
        <article>
          <Container className="py-12 sm:py-16">
            <LinkButton href="/projects" variant="ghost" size="sm" className="mb-6 -ml-3">
              <ArrowLeftIcon width="15" height="15" />
              All projects
            </LinkButton>

            <header>
              <div className="flex flex-wrap items-center gap-2">
                {project.category ? <Badge tone="accent">{project.category}</Badge> : null}
                {project.featured ? <Badge>Featured</Badge> : null}
                {dateRange ? (
                  <span className="font-mono text-xs text-fg-subtle">{dateRange}</span>
                ) : null}
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                {project.title}
              </h1>

              {project.summary ? (
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-fg-muted">
                  {project.summary}
                </p>
              ) : null}

              {project.githubUrl || project.demoUrl ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  {project.demoUrl ? (
                    <LinkButton href={project.demoUrl} external>
                      <ExternalIcon width="16" height="16" />
                      Live demo
                    </LinkButton>
                  ) : null}
                  {project.githubUrl ? (
                    <LinkButton href={project.githubUrl} variant="secondary" external>
                      <GithubIcon width="16" height="16" />
                      Source code
                    </LinkButton>
                  ) : null}
                </div>
              ) : null}
            </header>

            {cover ? (
              <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-card border border-border bg-surface-2">
                <Image
                  src={cover}
                  alt={project.image?.alt || `${project.title} preview`}
                  fill
                  sizes="(min-width: 1024px) 68rem, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            ) : null}

            <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1fr)_15rem]">
              <div>
                {paragraphs.length > 0 ? (
                  <div className="prose-content max-w-prose">
                    {paragraphs.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-fg-muted">No detailed write-up for this project yet.</p>
                )}

                {project.screenshots.length > 0 ? (
                  <section className="mt-12">
                    <h2 className="text-lg font-semibold">Screenshots</h2>
                    <div className="mt-4 space-y-6">
                      {project.screenshots.map((shot) => {
                        const url = mediaUrl(shot.media);
                        if (!url) return null;
                        return (
                          <figure key={shot.id}>
                            <div className="overflow-hidden rounded-card border border-border bg-surface-2">
                              <Image
                                src={url}
                                alt={shot.caption || shot.media.alt || `${project.title} screenshot`}
                                width={shot.media.width ?? 1600}
                                height={shot.media.height ?? 900}
                                sizes="(min-width: 1024px) 48rem, 100vw"
                                className="h-auto w-full"
                                loading="lazy"
                              />
                            </div>
                            {shot.caption ? (
                              <figcaption className="mt-2 text-sm text-fg-subtle">
                                {shot.caption}
                              </figcaption>
                            ) : null}
                          </figure>
                        );
                      })}
                    </div>
                  </section>
                ) : null}
              </div>

              <aside className="md:sticky md:top-24 md:h-fit">
                {project.technologies.length > 0 ? (
                  <>
                    <h2 className="text-xs font-semibold tracking-[0.1em] text-fg-subtle uppercase">
                      Built with
                    </h2>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {project.technologies.map((tech) => (
                        <li key={tech}>
                          <TechChip>{tech}</TechChip>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </aside>
            </div>
          </Container>
        </article>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      </main>

      <SiteFooter />
    </>
  );
}
