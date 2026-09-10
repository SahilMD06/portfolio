import type { MetadataRoute } from 'next';

import { env } from '@/lib/env';
import { getPublishedProjectSlugs } from '@/lib/services/content';

/**
 * Generated from the database, so a project published in /admin appears in the
 * sitemap without a rebuild.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getPublishedProjectSlugs();

  const projectEntries: MetadataRoute.Sitemap = slugs.map(({ slug, updatedAt }) => ({
    url: `${env.siteUrl}/projects/${slug}`,
    lastModified: updatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    {
      url: env.siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${env.siteUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...projectEntries,
  ];
}
