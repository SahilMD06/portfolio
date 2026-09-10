import 'server-only';

/**
 * Centralised environment access. Nothing here is ever imported by a client
 * component, so secrets cannot leak into the browser bundle.
 */

function optional(key: string): string | undefined {
  const v = process.env[key];
  return v && v.length > 0 ? v : undefined;
}

const isProd = process.env.NODE_ENV === 'production';

/** Dev-only fallback so `npm run dev` works before `.env.local` exists. */
const DEV_SESSION_SECRET = 'dev-only-insecure-session-secret-do-not-use-in-production';

export const env = {
  isProd,
  /** Undefined => use the embedded PGlite database in ./.data/pgdata */
  databaseUrl: optional('DATABASE_URL'),
  sessionSecret: (() => {
    const secret = optional('SESSION_SECRET');
    if (!secret) {
      if (isProd) {
        throw new Error('SESSION_SECRET must be set in production. See .env.example.');
      }
      return DEV_SESSION_SECRET;
    }
    return secret;
  })(),
  siteUrl: (optional('NEXT_PUBLIC_SITE_URL') ?? 'http://localhost:3000').replace(/\/$/, ''),
  storage: {
    driver: (optional('STORAGE_DRIVER') ?? 'local') as 'local' | 'supabase' | 'vercel-blob',
    supabaseUrl: optional('SUPABASE_URL'),
    supabaseServiceKey: optional('SUPABASE_SERVICE_ROLE_KEY'),
    bucket: optional('SUPABASE_STORAGE_BUCKET') ?? 'portfolio-media',
    /** Set automatically by Vercel when a Blob store is connected. */
    blobToken: optional('BLOB_READ_WRITE_TOKEN'),
  },
  admin: {
    email: optional('ADMIN_EMAIL') ?? 'admin@example.com',
    password: optional('ADMIN_PASSWORD'),
  },
} as const;
