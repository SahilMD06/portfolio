import Image from 'next/image';
import Link from 'next/link';

import { Card, TechChip } from '@/components/ui';
import { ExternalIcon, GithubIcon } from '@/components/ui/icons';
import type { PublicProject } from '@/lib/services/content';
import { mediaUrl } from '@/lib/services/media';

/**
 * `priority` should be set only for cards in the first viewport; everything
 * else lazy-loads, which is the default for next/image.
 */
export function ProjectCard({
  project,
  priority = false,
}: {
  project: PublicProject;
  priority?: boolean;
}) {
  const image = mediaUrl(project.image);

  return (
    <Card className="group relative flex flex-col overflow-hidden hover:border-border-strong">
      {image ? (
        <div className="relative aspect-[16/9] overflow-hidden border-b border-border bg-surface-2">
          <Image
            src={image}
            alt={project.image?.alt || `${project.title} preview`}
            fill
            // Two columns from `sm` up, one below — tells the browser which
            // srcset candidate to pick instead of over-fetching.
            sizes="(min-width: 1024px) 33rem, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            priority={priority}
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold">
            {/*
              Stretched link: the whole card is clickable, but the accessible
              name and focus target remain the title alone.
            */}
            <Link
              href={`/projects/${project.slug}`}
              className="after:absolute after:inset-0 hover:text-accent"
            >
              {project.title}
            </Link>
          </h3>
          {project.category ? (
            <span className="shrink-0 font-mono text-[0.7rem] text-fg-subtle">
              {project.category}
            </span>
          ) : null}
        </div>

        {project.summary ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-fg-muted">
            {project.summary}
          </p>
        ) : null}

        {project.technologies.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 5).map((tech) => (
              <li key={tech}>
                <TechChip>{tech}</TechChip>
              </li>
            ))}
            {project.technologies.length > 5 ? (
              <li>
                <TechChip>+{project.technologies.length - 5}</TechChip>
              </li>
            ) : null}
          </ul>
        ) : null}

        {project.githubUrl || project.demoUrl ? (
          // relative + z-10 keeps these above the stretched link overlay.
          <div className="relative z-10 mt-4 flex items-center gap-3 pt-1">
            {project.githubUrl ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg"
                aria-label={`${project.title} source code on GitHub`}
              >
                <GithubIcon width="14" height="14" />
                Code
              </a>
            ) : null}
            {project.demoUrl ? (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg"
                aria-label={`${project.title} live demo`}
              >
                <ExternalIcon width="14" height="14" />
                Live
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
