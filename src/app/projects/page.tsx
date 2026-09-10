import type { Metadata } from 'next';

import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { ProjectCard } from '@/components/site/project-card';
import { Container, EmptyState, LinkButton, SectionHeading } from '@/components/ui';
import { ArrowLeftIcon } from '@/components/ui/icons';
import { getProfile, getPublishedProjects } from '@/lib/services/content';

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return {
    title: 'Projects',
    description: `Software projects built by ${profile.fullName}.`,
    alternates: { canonical: '/projects' },
  };
}

export default async function ProjectsPage() {
  const [profile, projects] = await Promise.all([getProfile(), getPublishedProjects()]);

  return (
    <>
      <SiteHeader name={profile.fullName} />

      <main id="main">
        <Container className="py-12 sm:py-16">
          <LinkButton href="/" variant="ghost" size="sm" className="mb-6 -ml-3">
            <ArrowLeftIcon width="15" height="15" />
            Back to home
          </LinkButton>

          <SectionHeading
            eyebrow="Projects"
            title="Everything I've built"
            description={
              projects.length === 1 ? '1 project' : `${projects.length} projects, most recent first.`
            }
          />

          {projects.length === 0 ? (
            <EmptyState
              title="No projects published yet"
              description="Projects added in the admin dashboard will appear here."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {projects.map((project, index) => (
                <ProjectCard key={project.id} project={project} priority={index < 2} />
              ))}
            </div>
          )}
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}
