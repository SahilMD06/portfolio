import Link from 'next/link';

import { EmptyState, Section, SectionHeading } from '@/components/ui';
import { ArrowRightIcon } from '@/components/ui/icons';
import { FeaturedProjectCard, ProjectCard } from '@/components/site/project-card';
import { getFeaturedProjects, getPublishedProjects } from '@/lib/services/content';

/**
 * The lead featured project gets a large two-column card; the rest of the
 * featured set sits beneath in a grid. If nothing is marked featured, the most
 * recent published projects are shown instead so the section is never empty.
 */
export async function Projects({ index }: { index: string }) {
  const [featured, all] = await Promise.all([getFeaturedProjects(), getPublishedProjects()]);
  const shown = featured.length > 0 ? featured : all.slice(0, 4);
  const [lead, ...rest] = shown;
  const remaining = all.length - shown.length;
  const numberOf = (id: number) => all.findIndex((project) => project.id === id) + 1;

  return (
    <Section id="projects" spotlight>
      <SectionHeading
        index={index}
        eyebrow="Projects"
        title="Selected work."
        description="A few things I've built."
        action={
          all.length > shown.length ? (
            <Link href="/projects" className="btn btn-secondary btn-sm group">
              All projects
              <span className="font-mono text-xs text-fg-subtle">{all.length}</span>
              <ArrowRightIcon width="14" height="14" className="arrow-nudge" />
            </Link>
          ) : null
        }
      />

      {!lead ? (
        <EmptyState
          title="No projects published yet"
          description="Projects added in the admin dashboard will appear here."
        />
      ) : (
        <div className="space-y-5">
          <FeaturedProjectCard project={lead} number={numberOf(lead.id)} priority />

          {rest.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  number={numberOf(project.id)}
                  revealIndex={i}
                />
              ))}
            </div>
          ) : null}

          {remaining > 0 ? (
            <p className="pt-3 text-center text-sm text-fg-subtle" data-reveal="">
              <Link href="/projects" className="group inline-flex items-center gap-1.5 hover:text-fg">
                <span className="link-underline">
                  {remaining} more {remaining === 1 ? 'project' : 'projects'}
                </span>
                <ArrowRightIcon width="13" height="13" className="arrow-nudge" />
              </Link>
            </p>
          ) : null}
        </div>
      )}
    </Section>
  );
}
