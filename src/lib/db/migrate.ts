/**
 * Applies the SQL migrations in ./drizzle to whichever database is configured.
 *
 *   npm run db:migrate
 *
 * With DATABASE_URL set this targets the real Postgres server; without it, the
 * embedded PGlite database in ./.data/pgdata.
 */
import './load-env';

import path from 'node:path';

import { resolvePgliteDataDir } from './pglite-path';

const migrationsFolder = path.join(process.cwd(), 'drizzle');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const { migrate } = await import('drizzle-orm/postgres-js/migrator');
    const postgres = (await import('postgres')).default;
    // max: 1 — migrations must run on a single connection.
    const client = postgres(databaseUrl, { max: 1 });
    const db = drizzle(client);
    await migrate(db, { migrationsFolder });
    await client.end();
    console.warn('Migrations applied to PostgreSQL server.');
    return;
  }

  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const dataDir = resolvePgliteDataDir();
  const client = new PGlite(dataDir);
  await client.waitReady;
  const db = drizzle(client);
  await migrate(db, { migrationsFolder });
  await client.close();
  console.warn(`Migrations applied to embedded PGlite database at ${dataDir}`);
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
