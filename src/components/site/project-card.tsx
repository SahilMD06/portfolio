import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';

import { TechChip } from '@/components/ui';
import { ArrowRightIcon, ArrowUpRightIcon, GithubIcon } from '@/components/ui/icons';
import type { PublicProject } from '@/lib/services/content';
import { mediaUrl } from '@/lib/services/media';
import { glowPosition, pad2 } from '@/lib/portfolio';
import { cn, formatDateRange, outboundLinkProps } from '@/lib/utils';

/**
 * The visual half of a project card. Uses the uploaded image when there is
 * one; otherwise renders a restrained generated panel (dot grid, a glow placed
 * from the slug, the project's number and category) so cards never look empty.
 * On hover the inner layer drifts slightly.
 */
export function ProjectVisual({
  project,
  number,
  priority = false,
  sizes,
  className,
  showStack = false,
}: {
  project: PublicProject;
  number: number;
  priority?: boolean;
  sizes: string;
  className?: string;
  /** Large panels list the stack faintly, like a spec sheet, so they don't look empty. */
  showStack?: boolean;
}) {
  const image = mediaUrl(project.image);
  const glow = glowPosition(project.slug);

  return (
    <div className={cn('relative overflow-hidden bg-surface-2', className)}>
      <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.035]">
        {image ? (
          <Image
            src={image}
            alt={project.image?.alt || `${project.title} preview`}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
          />
        ) : (
          <>
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(var(--grid-line-lit) 0.75px, transparent 1px)',
                opacity: 0.35,
                backgroundSize: '18px 18px',
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={
                {
                  background: `radial-gradient(55% 60% at ${glow.x}% ${glow.y}%, var(--color-accent-subtle), transparent 70%)`,
                } as CSSProperties
              }
            />
            <span
              aria-hidden="true"
              className="absolute right-5 bottom-3 font-mono text-[clamp(3.5rem,2.5rem+4vw,6rem)] leading-none font-medium tracking-tighter text-fg/[0.06] select-none"
            >
              {pad2(number)}
            </span>
            {showStack && project.technologies.length > 0 ? (
              <ul
                aria-hidden="true"
                className="absolute bottom-6 left-6 hidden space-y-1.5 font-mono text-[0.72rem] text-fg-subtle/70 sm:block"
              >
                {project.technologies.slice(0, 6).map((tech, i) => (
                  <li key={tech} className="flex items-center gap-2.5">
                    <span className="text-accent/60">{pad2(i + 1)}</span>
                    {tech}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </div>
      {project.category ? (
        <span className="absolute top-4 left-4 rounded-full border border-border bg-bg/70 px-2.5 py-1 font-mono text-[0.68rem] tracking-wide text-fg-muted backdrop-blur">
          {project.category}
        </span>
      ) : null}
    </div>
  );
}

function ExternalLinks({ project }: { project: PublicProject }) {
  if (!project.githubUrl && !project.demoUrl) return null;
  return (
    // relative z-10 keeps these clickable above the card's stretched link.
    <div className="relative z-10 flex items-center gap-4">
      {project.githubUrl ? (
        <a
          href={project.githubUrl}
          {...outboundLinkProps(project.githubUrl)}
          aria-label={`${project.title} source code on GitHub`}
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          <GithubIcon width="14" height="14" />
          <span className="link-underline">Code</span>
        </a>
      ) : null}
      {project.demoUrl ? (
        <a
          href={project.demoUrl}
          {...outboundLinkProps(project.demoUrl)}
          aria-label={`${project.title} live demo`}
          className="group/demo inline-flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          <span className="link-underline">Live demo</span>
          <ArrowUpRightIcon
            width="14"
            height="14"
            className="transition-transform duration-200 group-hover/demo:translate-x-0.5 group-hover/demo:-translate-y-0.5"
          />
        </a>
      ) : null}
    </div>
  );
}

/** Large, two-column card for the lead project. */
export function FeaturedProjectCard({
  project,
  number,
  priority = false,
}: {
  project: PublicProject;
  number: number;
  priority?: boolean;
}) {
  const dates = formatDateRange(project.startDate, project.endDate);

  return (
    <article
      data-spotlight=""
      data-reveal=""
      className="surface surface-interactive spotlight group grid grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
    >
      <ProjectVisual
        project={project}
        number={number}
        priority={priority}
        showStack
        sizes="(min-width: 1024px) 38rem, 100vw"
        className="aspect-[16/10] border-b border-border lg:aspect-auto lg:min-h-[22rem] lg:border-r lg:border-b-0"
      />

      <div className="flex flex-col p-6 sm:p-8 lg:p-10">
        <p className="t-label flex items-center gap-3">
          <span className="text-accent">Featured</span>
          {dates ? <span>{dates}</span> : null}
        </p>

        <h3 className="mt-4 text-[clamp(1.6rem,1.3rem+1vw,2.1rem)] leading-tight tracking-tight">
          <Link
            href={`/projects/${project.slug}`}
            className="outline-none after:absolute after:inset-0 after:z-0 after:rounded-[inherit] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent"
          >
            {project.title}
          </Link>
        </h3>

        {project.summary ? (
          <p className="mt-4 leading-relaxed text-fg-muted">{project.summary}</p>
        ) : null}

        {project.technologies.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-2">
            {project.technologies.slice(0, 7).map((tech) => (
              <li key={tech}>
                <TechChip>{tech}</TechChip>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-8">
          <ExternalLinks project={project} />
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
            Case study
            <ArrowRightIcon width="15" height="15" className="arrow-nudge" />
          </span>
        </div>
      </div>
    </article>
  );
}

/** Standard project card. */
export function ProjectCard({
  project,
  number,
  priority = false,
  revealIndex,
}: {
  project: PublicProject;
  number: number;
  priority?: boolean;
  revealIndex?: number;
}) {
  const dates = formatDateRange(project.startDate, project.endDate);

  return (
    <article
      data-spotlight=""
      data-reveal=""
      style={revealIndex !== undefined ? ({ '--i': revealIndex } as CSSProperties) : undefined}
      className="surface surface-interactive spotlight group flex flex-col overflow-hidden"
    >
      <ProjectVisual
        project={project}
        number={number}
        priority={priority}
        sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
        className="aspect-[16/9] border-b border-border"
      />

      <div className="flex flex-1 flex-col p-6">
        {dates ? <p className="t-label">{dates}</p> : null}

        <h3 className="mt-2 text-lg leading-snug tracking-tight">
          <Link
            href={`/projects/${project.slug}`}
            className="outline-none after:absolute after:inset-0 after:z-0 after:rounded-[inherit] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent"
          >
            {project.title}
          </Link>
        </h3>

        {project.summary ? (
          <p className="mt-2.5 line-clamp-3 text-[0.925rem] leading-relaxed text-fg-muted">
            {project.summary}
          </p>
        ) : null}

        {project.technologies.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 4).map((tech) => (
              <li key={tech}>
                <TechChip>{tech}</TechChip>
              </li>
            ))}
            {project.technologies.length > 4 ? (
              <li>
                <TechChip>+{project.technologies.length - 4}</TechChip>
              </li>
            ) : null}
          </ul>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <ExternalLinks project={project} />
          <ArrowRightIcon
            width="16"
            height="16"
            aria-hidden="true"
            className="arrow-nudge ml-auto text-fg-subtle transition-colors group-hover:text-accent"
          />
        </div>
      </div>
    </article>
  );
}
