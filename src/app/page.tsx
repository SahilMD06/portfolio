import { Suspense } from 'react';

import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { SectionSkeleton } from '@/components/site/section-skeleton';
import { Hero } from '@/components/site/sections/hero';
import { About } from '@/components/site/sections/about';
import { Experience } from '@/components/site/sections/experience';
import { Research } from '@/components/site/sections/research';
import { Projects } from '@/components/site/sections/projects';
import { Skills } from '@/components/site/sections/skills';
import { Credentials } from '@/components/site/sections/credentials';
import { Contact } from '@/components/site/sections/contact';
import { env } from '@/lib/env';
import { isResearch, pad2 } from '@/lib/portfolio';
import {
  getExperiences,
  getProfile,
  getSiteSettings,
  getSocialLinks,
} from '@/lib/services/content';

/**
 * Progressive rendering.
 *
 * The header and hero are awaited so the first viewport is complete at once.
 * Every section below is its own Suspense boundary, so the server streams each
 * one as its data resolves instead of holding the document for the slowest.
 *
 * Section numbers are derived from which sections have content, so hiding
 * Research (for example) never leaves a gap in the numbering.
 */
export default async function HomePage() {
  const experiences = await getExperiences();
  const hasResearch = experiences.some(isResearch);

  const order = ['about', 'experience', ...(hasResearch ? ['research'] : []), 'projects', 'skills', 'credentials', 'contact'];
  const n = (id: string) => pad2(order.indexOf(id) + 1);

  return (
    <>
      <SiteHeader />

      <main id="main">
        <Hero />

        <Suspense fallback={<SectionSkeleton rows={2} />}>
          <About index={n('about')} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton rows={3} />}>
          <Experience index={n('experience')} />
        </Suspense>

        {hasResearch ? (
          <Suspense fallback={<SectionSkeleton rows={1} />}>
            <Research index={n('research')} />
          </Suspense>
        ) : null}

        <Suspense fallback={<SectionSkeleton rows={2} cards />}>
          <Projects index={n('projects')} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton rows={3} cards />}>
          <Skills index={n('skills')} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton rows={3} cards />}>
          <Credentials index={n('credentials')} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton rows={1} />}>
          <Contact index={n('contact')} />
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <SiteFooter />
      </Suspense>

      <Suspense fallback={null}>
        <StructuredData />
      </Suspense>
    </>
  );
}

/**
 * schema.org Person markup, so search engines can associate the name, role and
 * profile links. Values come from the database, not hardcoded.
 */
async function StructuredData() {
  const [profile, settings, links] = await Promise.all([
    getProfile(),
    getSiteSettings(),
    getSocialLinks(),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.fullName,
    jobTitle: profile.headline,
    description: settings.seoDescription || profile.shortBio || undefined,
    url: env.siteUrl,
    email: profile.email ? `mailto:${profile.email}` : undefined,
    address: profile.location ? { '@type': 'PostalAddress', addressLocality: profile.location } : undefined,
    sameAs: links.filter((l) => !l.url.startsWith('mailto:')).map((l) => l.url),
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is escaped below; `<` cannot terminate the script tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
      }}
    />
  );
}
