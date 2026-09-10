import 'server-only';

import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '@/lib/env';
import { UploadError } from './policy';

export {
  ALLOWED_TYPES,
  DOCUMENT_TYPES,
  IMAGE_TYPES,
  MAX_DOCUMENT_BYTES,
  MAX_IMAGE_BYTES,
  UploadError,
  validateUpload,
} from './policy';

/* -------------------------------------------------------------------------- */
/* Drivers                                                                    */
/* -------------------------------------------------------------------------- */

export type StorageDriverName = 'local' | 'supabase' | 'vercel-blob';

export interface StorageDriver {
  readonly name: StorageDriverName;
  /**
   * Writes the object and returns the key that should be persisted in
   * `media.storage_key`. Most drivers return `key` unchanged; Vercel Blob mints
   * its own URL, so it returns that instead.
   */
  put(key: string, data: Buffer, contentType: string): Promise<string>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  /** Absolute URL when the driver serves files directly, else null. */
  publicUrl(key: string): string | null;
}

/* --- local filesystem ----------------------------------------------------- */

const LOCAL_ROOT = path.join(process.cwd(), '.data', 'uploads');

/** Guards against `..` escaping the uploads root. */
function resolveLocalPath(key: string): string {
  const full = path.resolve(LOCAL_ROOT, key);
  if (full !== LOCAL_ROOT && !full.startsWith(LOCAL_ROOT + path.sep)) {
    throw new UploadError('Invalid storage key.');
  }
  return full;
}

const localDriver: StorageDriver = {
  name: 'local',
  async put(key, data) {
    const full = resolveLocalPath(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
    return key;
  },
  async get(key) {
    try {
      return await fs.readFile(resolveLocalPath(key));
    } catch {
      return null;
    }
  },
  async delete(key) {
    try {
      await fs.unlink(resolveLocalPath(key));
    } catch {
      // Already gone — deletion is idempotent.
    }
  },
  publicUrl() {
    // Served through the /media/[id] route handler instead.
    return null;
  },
};

/* --- Vercel Blob ---------------------------------------------------------- */

/**
 * Object storage for Vercel deployments.
 *
 * A serverless filesystem is ephemeral and read-only, so the local driver
 * cannot be used in production — uploads would disappear on the next cold
 * start. Blob stores the bytes off-instance and serves them from its own CDN.
 *
 * The blob URL is not derivable from the key we generate, so `put` returns the
 * minted URL and that is what gets persisted as the storage key. `publicUrl`
 * then simply hands it back, so `/media/[id]` redirects rather than proxying
 * bytes through a function invocation.
 */
function createVercelBlobDriver(): StorageDriver {
  const token = env.storage.blobToken;
  if (!token) {
    throw new Error(
      'STORAGE_DRIVER=vercel-blob requires BLOB_READ_WRITE_TOKEN. Connect a Blob store to the project in the Vercel dashboard.',
    );
  }

  return {
    name: 'vercel-blob',
    async put(key, data, contentType) {
      const { put } = await import('@vercel/blob');
      const result = await put(key, data, {
        access: 'public',
        token,
        contentType,
        // The key already contains a UUID, so a second random suffix would only
        // make the stored URL harder to reason about.
        addRandomSuffix: false,
      });
      return result.url;
    },
    async get(key) {
      // `key` is the blob URL for this driver.
      const res = await fetch(key);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    },
    async delete(key) {
      const { del } = await import('@vercel/blob');
      try {
        await del(key, { token });
      } catch {
        // Already gone — deletion is idempotent.
      }
    },
    publicUrl(key) {
      return key.startsWith('https://') ? key : null;
    },
  };
}

/* --- Supabase Storage ----------------------------------------------------- */

function createSupabaseDriver(): StorageDriver {
  const { supabaseUrl, supabaseServiceKey, bucket } = env.storage;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('STORAGE_DRIVER=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  const base = supabaseUrl.replace(/\/$/, '');
  const authHeaders = {
    Authorization: `Bearer ${supabaseServiceKey}`,
    apikey: supabaseServiceKey,
  };

  return {
    name: 'supabase',
    async put(key, data, contentType) {
      const res = await fetch(`${base}/storage/v1/object/${bucket}/${key}`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': contentType, 'x-upsert': 'true' },
        body: new Uint8Array(data),
      });
      if (!res.ok) {
        throw new UploadError(`Storage upload failed (${res.status}): ${await res.text()}`);
      }
      return key;
    },
    async get(key) {
      const res = await fetch(`${base}/storage/v1/object/${bucket}/${key}`, {
        headers: authHeaders,
      });
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    },
    async delete(key) {
      await fetch(`${base}/storage/v1/object/${bucket}/${key}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
    },
    publicUrl(key) {
      return `${base}/storage/v1/object/public/${bucket}/${key}`;
    },
  };
}

let cachedDriver: StorageDriver | undefined;

export function getStorage(): StorageDriver {
  if (!cachedDriver) {
    switch (env.storage.driver) {
      case 'supabase':
        cachedDriver = createSupabaseDriver();
        break;
      case 'vercel-blob':
        cachedDriver = createVercelBlobDriver();
        break;
      default:
        cachedDriver = localDriver;
    }
  }
  return cachedDriver;
}
