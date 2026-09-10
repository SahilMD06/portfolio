import { Analytics } from '@vercel/analytics/next';

import { getSiteSettings } from '@/lib/services/content';

/**
 * Vercel Web Analytics: ~1 KB, loaded async after hydration, no cookies and no
 * consent banner required.
 *
 * Rendered only when actually deployed on Vercel. The script is served from
 * /_vercel/insights/*, which only exists on that platform — off-platform it
 * would 404 on every page load, so the component is skipped entirely.
 *
 * Also gated on the `analyticsEnabled` site setting, so it can be switched off
 * from /admin without a code change.
 */
export async function SiteAnalytics() {
  if (!process.env.VERCEL) return null;

  const settings = await getSiteSettings();
  if (!settings.analyticsEnabled) return null;

  return <Analytics />;
}
