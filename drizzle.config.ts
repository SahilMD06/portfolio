import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * `drizzle-kit generate` only needs the schema, so DATABASE_URL is optional
 * here. `drizzle-kit push` / `studio` need a real server and will fail loudly
 * without it — for local PGlite development use `npm run db:migrate` instead.
 */
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? 'postgres://localhost:5432/unused' },
  strict: true,
  verbose: true,
});
