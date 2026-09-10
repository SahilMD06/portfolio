import fs from 'node:fs';
import path from 'node:path';

/**
 * PGlite creates its data directory with a non-recursive mkdir, so the parent
 * (./.data) has to exist first. Returns the absolute data directory path.
 */
export function ensurePgliteDataDir(): string {
  const dir = path.join(process.cwd(), '.data', 'pgdata');
  fs.mkdirSync(path.dirname(dir), { recursive: true });
  return dir;
}

/**
 * Removes a leftover lock file.
 *
 * PGlite writes a constant sentinel pid (-42) into postmaster.pid, so the file
 * carries no information about whether a process is actually alive — but its
 * mere presence makes the next startup abort. Killing `npm run dev` without a
 * clean shutdown therefore leaves the database unopenable until it is removed.
 *
 * Concurrency is handled by never letting two processes share a directory (see
 * resolvePgliteDataDir), so clearing this on open is safe.
 */
function clearStaleLock(dir: string): void {
  try {
    fs.rmSync(path.join(dir, 'postmaster.pid'), { force: true });
  } catch {
    // Nothing to clear.
  }
}

/**
 * The directory the current process should open.
 *
 * A file-backed PGlite database allows only one process at a time, so a running
 * `npm run dev` would otherwise make `npm run build` fail. A production build
 * only ever *reads* content, so it works from a throwaway snapshot and leaves
 * the primary directory to the dev server.
 *
 * This applies to local development only; with DATABASE_URL set, the real
 * Postgres server handles concurrent connections and this is never called.
 */
export function resolvePgliteDataDir(): string {
  const primary = ensurePgliteDataDir();

  if (process.env.NEXT_PHASE === 'phase-production-build' && fs.existsSync(primary)) {
    const snapshot = `${primary}-build`;
    try {
      fs.rmSync(snapshot, { recursive: true, force: true });
      fs.cpSync(primary, snapshot, { recursive: true });
      clearStaleLock(snapshot);
      return snapshot;
    } catch {
      // Snapshot failed (e.g. first run with no database yet) — use the primary.
    }
  }

  clearStaleLock(primary);
  return primary;
}
