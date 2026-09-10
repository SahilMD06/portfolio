import 'server-only';

import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';

import { env } from '@/lib/env';
import { resolvePgliteDataDir } from './pglite-path';
import * as schema from './schema';

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * One connection per process, memoised across Next.js hot reloads via
 * globalThis so dev does not leak connections / PGlite instances.
 */
const globalForDb = globalThis as unknown as { __portfolioDb?: Promise<Database> };

async function createDatabase(): Promise<Database> {
  if (env.databaseUrl) {
    // Production path: a real PostgreSQL server (Supabase / Neon / RDS).
    const [{ drizzle }, postgresModule] = await Promise.all([
      import('drizzle-orm/postgres-js'),
      import('postgres'),
    ]);
    const postgres = postgresModule.default;
    const client = postgres(env.databaseUrl, {
      // Serverless-friendly: small pool, short idle timeout.
      max: 5,
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false,
    });
    return drizzle(client, { schema }) as unknown as Database;
  }

  // Local path: embedded PGlite. Real Postgres compiled to WASM, persisted to
  // disk, so no server or Docker is required for development.
  const [{ PGlite }, { drizzle }] = await Promise.all([
    import('@electric-sql/pglite'),
    import('drizzle-orm/pglite'),
  ]);
  const client = new PGlite(resolvePgliteDataDir());
  await client.waitReady;
  return drizzle(client, { schema }) as unknown as Database;
}

export function getDb(): Promise<Database> {
  globalForDb.__portfolioDb ??= createDatabase();
  return globalForDb.__portfolioDb;
}

export { schema };
