import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // PGlite ships a .wasm/.data payload that must not be bundled by the compiler.
  serverExternalPackages: ['@electric-sql/pglite'],

  /**
   * A file-backed PGlite database can only be opened by one process at a time,
   * but Next prerenders pages across many parallel workers. When running on the
   * embedded database (no DATABASE_URL) the build is therefore serialised.
   * Against a real Postgres server the default parallelism is used.
   */
  ...(process.env.DATABASE_URL
    ? {}
    : {
        experimental: {
          cpus: 1,
          workerThreads: false,
          staticGenerationMaxConcurrency: 1,
        },
      }),
  images: {
    formats: ['image/avif', 'image/webp'],
    // Remote images are only ever served from the configured storage origin.
    remotePatterns: process.env.NEXT_PUBLIC_STORAGE_ORIGIN
      ? [{ protocol: 'https', hostname: new URL(process.env.NEXT_PUBLIC_STORAGE_ORIGIN).hostname }]
      : [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
