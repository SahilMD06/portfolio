import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';

import './globals.css';
import { SiteAnalytics } from '@/components/site/analytics';
import { THEME_INIT_SCRIPT } from '@/components/site/theme-store';
import { env } from '@/lib/env';
import { getProfile, getSiteSettings } from '@/lib/services/content';
import { getMedia, mediaUrl } from '@/lib/services/media';

/**
 * Self-hosted by Next at build time: no runtime request to Google, and the
 * `size-adjust` fallback means swapping in the real font causes no layout shift.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcfcfd' },
    { media: '(prefers-color-scheme: dark)', color: '#131417' },
  ],
};

/** Metadata comes from the database, so SEO is editable from /admin. */
export async function generateMetadata(): Promise<Metadata> {
  const [profile, settings] = await Promise.all([getProfile(), getSiteSettings()]);

  const title = settings.seoTitle || `${profile.fullName} — ${profile.headline}`;
  const description =
    settings.seoDescription ||
    profile.shortBio ||
    `Portfolio of ${profile.fullName}, ${profile.headline}.`;

  const ogImage = settings.ogImageMediaId ? await getMedia(settings.ogImageMediaId) : null;
  const ogImageUrl = ogImage ? mediaUrl(ogImage) : null;

  return {
    metadataBase: new URL(env.siteUrl),
    title: {
      default: title,
      template: `%s — ${profile.fullName}`,
    },
    description,
    applicationName: `${profile.fullName} Portfolio`,
    authors: [{ name: profile.fullName }],
    creator: profile.fullName,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: `${profile.fullName} — Portfolio`,
      title,
      description,
      url: env.siteUrl,
      locale: 'en_GB',
      ...(ogImageUrl ? { images: [{ url: ogImageUrl, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: ogImageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/*
          Must run before first paint so the stored theme is applied during the
          initial style pass. suppressHydrationWarning above covers the
          attribute this adds to <html>.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only rounded-lg bg-accent px-4 py-2 text-accent-fg focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100]"
        >
          Skip to content
        </a>
        {children}
        <Suspense fallback={null}>
          <SiteAnalytics />
        </Suspense>
      </body>
    </html>
  );
}
