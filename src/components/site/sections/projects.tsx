import { EmptyState, LinkButton, Section, SectionHeading } from '@/components/ui';
import { ArrowRightIcon } from '@/components/ui/icons';
import { ProjectCard } from '@/components/site/project-card';
import { getFeaturedProjects, getPublishedProjects } from '@/lib/services/content';

/**
 * Shows featured projects. If nothing is marked featured we fall back to the
 * most recent published projects, so the homepage is never empty just because
 * a checkbox was missed in the admin.
 */
export async function Projects() {
  const featured = await getFeaturedProjects();
  const all = await getPublishedProjects();
  const shown = featured.length > 0 ? featured : all.slice(0, 4);
  const hasMore = all.length > shown.length;

  return (
    <Section id="projects" className="reveal">
      <SectionHeading
        eyebrow="Projects"
        title="Selected work"
        description="A few things I have built recently."
        action={
          hasMore ? (
            <LinkButton href="/projects" variant="secondary" size="sm">
              All projects
              <ArrowRightIcon width="15" height="15" />
            </LinkButton>
          ) : null
        }
      />

      {shown.length === 0 ? (
        <EmptyState
          title="No projects published yet"
          description="Projects added in the admin dashboard will appear here."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {shown.map((project, index) => (
            // The first two cards are above the fold on most screens.
            <ProjectCard key={project.id} project={project} priority={index < 2} />
          ))}
        </div>
      )}
    </Section>
  );
}
