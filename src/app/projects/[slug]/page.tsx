import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { ProjectVisual } from '@/components/site/project-card';
import { Container, TechChip } from '@/components/ui';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  GithubIcon,
} from '@/components/ui/icons';
import { env } from '@/lib/env';
import { getProfile, getProjectBySlug, getPublishedProjects } from '@/lib/services/content';
import { mediaUrl } from '@/lib/services/media';
import { displayUrl, pad2 } from '@/lib/portfolio';
import { formatDateRange, outboundLinkProps, toParagraphs } from '@/lib/utils';

const delay = (ms: number) => ({ '--enter-delay': `${ms}ms` }) as CSSProperties;

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
  const [project, profile] = await Promise.all([getProjectBySlug(slug), getProfile()]);
  if (!project) return { title: 'Project not found', robots: { index: false, follow: false } };

  const image = mediaUrl(project.image);
  const description = project.summary || `${project.title} — a project by ${profile.fullName}.`;

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
  const [profile, project, all] = await Promise.all([
    getProfile(),
    getProjectBySlug(slug),
    getPublishedProjects(),
  ]);

  if (!project) notFound();

  const position = all.findIndex((item) => item.id === project.id);
  const previous = position > 0 ? all[position - 1] : undefined;
  const next = position >= 0 && position < all.length - 1 ? all[position + 1] : undefined;

  const cover = mediaUrl(project.image);
  const paragraphs = toParagraphs(project.description);
  const dateRange = formatDateRange(project.startDate, project.endDate);
  const links = [project.demoUrl, project.githubUrl].filter((url): url is string => Boolean(url));

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
      <SiteHeader />

      <main id="main">
        <article>
          <header className="relative isolate overflow-hidden border-b border-border">
            <div aria-hidden="true" className="enter-fade absolute inset-0 -z-10">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(55% 60% at 50% -15%, var(--color-accent-subtle), transparent 70%)',
                }}
              />
              <div className="grid-backdrop" />
            </div>

            <Container className="pt-[clamp(3rem,2rem+4vw,6rem)] pb-[clamp(2.5rem,2rem+3vw,4.5rem)]">
              <Link
                href="/projects"
                className="group enter inline-flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
              >
                <ArrowLeftIcon
                  width="14"
                  height="14"
                  className="transition-transform duration-200 group-hover:-translate-x-0.5"
                />
                All projects
              </Link>

              <p
                className="t-label enter mt-10 flex flex-wrap items-center gap-x-3 gap-y-2"
                style={delay(80)}
              >
                {position >= 0 ? <span className="text-accent">{pad2(position + 1)}</span> : null}
                {project.category ? <span>{project.category}</span> : null}
                {project.featured ? (
                  <span className="rounded-full border border-accent-line bg-accent-subtle px-2 py-0.5 tracking-normal text-accent normal-case">
                    Featured
                  </span>
                ) : null}
              </p>

              <h1
                className="enter mt-5 max-w-4xl text-[clamp(2.3rem,1.5rem+3.4vw,4.2rem)] leading-[1.04] font-semibold tracking-[-0.04em]"
                style={delay(160)}
              >
                {project.title}
              </h1>

              {project.summary ? (
                <p className="t-lead enter mt-6 max-w-2xl" style={delay(240)}>
                  {project.summary}
                </p>
              ) : null}

              {project.githubUrl || project.demoUrl ? (
                <div className="enter mt-9 flex flex-wrap gap-3" style={delay(320)}>
                  {project.demoUrl ? (
                    <a
                      href={project.demoUrl}
                      {...outboundLinkProps(project.demoUrl)}
                      className="btn btn-primary group"
                    >
                      Live demo
                      <ArrowUpRightIcon width="15" height="15" className="arrow-nudge arrow-nudge-diag" />
                    </a>
                  ) : null}
                  {project.githubUrl ? (
                    <a
                      href={project.githubUrl}
                      {...outboundLinkProps(project.githubUrl)}
                      className="btn btn-secondary"
                    >
                      <GithubIcon width="15" height="15" />
                      Source code
                    </a>
                  ) : null}
                </div>
              ) : null}
            </Container>
          </header>

          <Container className="py-[clamp(3rem,2rem+4vw,6rem)]">
            <div className="enter group" style={delay(360)}>
              {cover ? (
                <div className="relative aspect-[16/9] overflow-hidden rounded-card border border-border bg-surface-2">
                  <Image
                    src={cover}
                    alt={project.image?.alt || `${project.title} preview`}
                    fill
                    sizes="(min-width: 1024px) 72rem, 100vw"
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                <ProjectVisual
                  project={{ ...project, category: '' }}
                  number={position + 1}
                  sizes="100vw"
                  className="aspect-[16/9] rounded-card border border-border sm:aspect-[21/9]"
                />
              )}
            </div>

            <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
              <div data-reveal="">
                <p className="t-label mb-5">Overview</p>
                {paragraphs.length > 0 ? (
                  <div className="prose-content max-w-[68ch] text-[1.05rem]">
                    {paragraphs.map((paragraph, index) => (
                      <p key={index} className={index === 0 ? 'text-fg' : undefined}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-fg-muted">No detailed write-up for this project yet.</p>
                )}

                {project.screenshots.length > 0 ? (
                  <section className="mt-14">
                    <h2 className="t-label mb-5">Screenshots</h2>
                    <div className="space-y-8">
                      {project.screenshots.map((shot) => {
                        const url = mediaUrl(shot.media);
                        if (!url) return null;
                        return (
                          <figure key={shot.id} data-reveal="">
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
                              <figcaption className="mt-3 text-sm text-fg-subtle">
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

              <aside className="lg:sticky lg:top-24 lg:h-fit" data-reveal="">
                <dl className="surface divide-y divide-border">
                  {project.technologies.length > 0 ? (
                    <div className="p-5">
                      <dt className="t-label mb-3">Built with</dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {project.technologies.map((tech) => (
                          <TechChip key={tech}>{tech}</TechChip>
                        ))}
                      </dd>
                    </div>
                  ) : null}
                  {dateRange ? (
                    <div className="p-5">
                      <dt className="t-label mb-2">Timeline</dt>
                      <dd className="text-sm text-fg">{dateRange}</dd>
                    </div>
                  ) : null}
                  {links.length > 0 ? (
                    <div className="p-5">
                      <dt className="t-label mb-3">Links</dt>
                      <dd className="space-y-2.5">
                        {links.map((url) => (
                          <a
                            key={url}
                            href={url}
                            {...outboundLinkProps(url)}
                            className="group flex items-center justify-between gap-3 text-sm text-fg-muted transition-colors hover:text-fg"
                          >
                            <span className="truncate font-mono text-xs">{displayUrl(url)}</span>
                            <ArrowUpRightIcon
                              width="14"
                              height="14"
                              className="arrow-nudge arrow-nudge-diag shrink-0"
                            />
                          </a>
                        ))}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </aside>
            </div>

            {previous || next ? (
              <nav
                aria-label="More projects"
                data-spotlight-group=""
                className="mt-20 grid grid-cols-1 gap-4 border-t border-border pt-10 sm:grid-cols-2"
              >
                {previous ? (
                  <Link
                    href={`/projects/${previous.slug}`}
                    data-spotlight=""
                    className="surface surface-interactive spotlight group p-5"
                  >
                    <span className="t-label flex items-center gap-2">
                      <ArrowLeftIcon
                        width="13"
                        height="13"
                        className="transition-transform duration-200 group-hover:-translate-x-0.5"
                      />
                      Previous
                    </span>
                    <span className="mt-2 block font-medium tracking-tight">{previous.title}</span>
                  </Link>
                ) : (
                  <span className="hidden sm:block" aria-hidden="true" />
                )}
                {next ? (
                  <Link
                    href={`/projects/${next.slug}`}
                    data-spotlight=""
                    className="surface surface-interactive spotlight group p-5 sm:text-right"
                  >
                    <span className="t-label flex items-center gap-2 sm:justify-end">
                      Next
                      <ArrowRightIcon width="13" height="13" className="arrow-nudge" />
                    </span>
                    <span className="mt-2 block font-medium tracking-tight">{next.title}</span>
                  </Link>
                ) : null}
              </nav>
            ) : null}
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
