import 'server-only';

import { revalidatePath, revalidateTag, unstable_cache, updateTag } from 'next/cache';

/**
 * Cache tags, one per content type. Admin mutations invalidate only the tags
 * they actually touch, so editing a skill never evicts the projects cache.
 */
export const TAGS = {
  profile: 'profile',
  settings: 'settings',
  skills: 'skills',
  projects: 'projects',
  experiences: 'experiences',
  education: 'education',
  certifications: 'certifications',
  achievements: 'achievements',
  social: 'social',
  media: 'media',
} as const;

export type Tag = (typeof TAGS)[keyof typeof TAGS];

/** One hour. Content is tag-invalidated on write, so this is only a backstop. */
const DEFAULT_REVALIDATE = 3600;

/**
 * Bump whenever the *shape* of cached query results changes (a new column, a
 * renamed field). The data cache outlives builds and deployments, so without
 * this a new deploy can be served rows cached by the old code — e.g. records
 * missing a newly added column.
 */
const CACHE_SCHEMA_VERSION = 'v2';

/**
 * Wraps a data-layer read in Next's data cache, keyed and tagged so it can be
 * invalidated precisely.
 */
export function cachedQuery<TArgs extends unknown[], TResult>(
  keyParts: string[],
  tags: Tag[],
  fn: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  return unstable_cache(fn, [CACHE_SCHEMA_VERSION, ...keyParts], {
    tags,
    revalidate: DEFAULT_REVALIDATE,
  });
}

/**
 * Called after every successful mutation.
 *
 * Public pages are re-rendered from freshly-read data, while untouched content
 * types keep their cached values.
 */
function invalidate(tag: Tag): void {
  try {
    // Inside a Server Action this expires the tag immediately, giving
    // read-your-own-writes: the redirect after saving already shows new data.
    updateTag(tag);
  } catch {
    // updateTag throws outside a Server Action (e.g. the /api/admin/* route
    // handlers). Next exposes no predicate for that context, so the fallback
    // is selected by catching rather than by asking.
    revalidateTag(tag, 'max');
  }
}

/**
 * A path to revalidate. `type: 'page'` is required for dynamic route patterns
 * such as `/projects/[slug]`, which invalidates every rendered project page.
 */
export type RevalidatePath = string | { path: string; type: 'page' | 'layout' };

export function revalidateEntity(tags: Tag[], paths: RevalidatePath[] = []): void {
  for (const tag of tags) invalidate(tag);
  // The homepage composes every section, so it always needs refreshing.
  revalidatePath('/');
  for (const entry of paths) {
    if (typeof entry === 'string') revalidatePath(entry);
    else revalidatePath(entry.path, entry.type);
  }
}
