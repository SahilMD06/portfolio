import type { Metadata } from 'next';
import Link from 'next/link';

import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { ProjectCard } from '@/components/site/project-card';
import { Container, EmptyState } from '@/components/ui';
import { ArrowLeftIcon } from '@/components/ui/icons';
import { getProfile, getPublishedProjects } from '@/lib/services/content';
import { pad2 } from '@/lib/portfolio';

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return {
    title: 'Projects',
    description: `Software projects built by ${profile.fullName}.`,
    alternates: { canonical: '/projects' },
  };
}

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

  return (
    <>
      <SiteHeader />

      <main id="main">
        <section className="relative isolate overflow-hidden border-b border-border">
          <div aria-hidden="true" className="enter-fade absolute inset-0 -z-10">
            <div className="grid-backdrop" />
          </div>
          <Container className="pt-[clamp(3rem,2rem+4vw,6rem)] pb-[clamp(2.5rem,2rem+2vw,4rem)]">
            <Link
              href="/"
              className="group enter inline-flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
            >
              <ArrowLeftIcon
                width="14"
                height="14"
                className="transition-transform duration-200 group-hover:-translate-x-0.5"
              />
              Home
            </Link>
            <p className="t-label enter mt-10 flex items-center gap-3" style={{ '--enter-delay': '80ms' } as React.CSSProperties}>
              <span className="text-accent">{pad2(projects.length)}</span>
              <span className="h-px w-8 bg-border-strong" aria-hidden="true" />
              <span>Projects</span>
            </p>
            <h1 className="t-display enter mt-5 max-w-3xl" style={{ '--enter-delay': '160ms' } as React.CSSProperties}>
              Everything I&apos;ve built.
            </h1>
          </Container>
        </section>

        <section data-spotlight-group="" className="py-[clamp(3rem,2rem+4vw,6rem)]">
          <Container>
            {projects.length === 0 ? (
              <EmptyState
                title="No projects published yet"
                description="Projects added in the admin dashboard will appear here."
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    number={index + 1}
                    priority={index < 3}
                    revealIndex={index % 3}
                  />
                ))}
              </div>
            )}
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
