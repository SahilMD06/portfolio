import { Suspense } from 'react';

import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { SectionSkeleton } from '@/components/site/section-skeleton';
import { Hero } from '@/components/site/sections/hero';
import { About } from '@/components/site/sections/about';
import { Skills } from '@/components/site/sections/skills';
import { Experience } from '@/components/site/sections/experience';
import { Projects } from '@/components/site/sections/projects';
import { EducationSection } from '@/components/site/sections/education';
import { Achievements, Certifications } from '@/components/site/sections/certifications';
import { Contact } from '@/components/site/sections/contact';
import { env } from '@/lib/env';
import { getProfile, getSiteSettings, getSocialLinks } from '@/lib/services/content';

/**
 * Progressive rendering.
 *
 * The header and Hero are awaited so the first viewport is complete and
 * interactive immediately. Every section below is its own Suspense boundary, so
 * the server streams each one as its query resolves rather than holding the
 * whole document until the slowest query finishes.
 */
export default async function HomePage() {
  const profile = await getProfile();

  return (
    <>
      <SiteHeader name={profile.fullName} />

      <main id="main">
        <Hero />

        <Suspense fallback={<SectionSkeleton rows={1} />}>
          <About />
        </Suspense>

        <Suspense fallback={<SectionSkeleton rows={2} cards />}>
          <Skills />
        </Suspense>

        <Suspense fallback={<SectionSkeleton rows={2} />}>
          <Experience />
        </Suspense>

        <Suspense fallback={<SectionSkeleton rows={2} cards />}>
          <Projects />
        </Suspense>

        <Suspense fallback={<SectionSkeleton rows={1} />}>
          <EducationSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton rows={2} cards />}>
          <Certifications />
        </Suspense>

        <Suspense fallback={<SectionSkeleton rows={1} />}>
          <Achievements />
        </Suspense>

        <Suspense fallback={<SectionSkeleton rows={1} cards />}>
          <Contact />
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
