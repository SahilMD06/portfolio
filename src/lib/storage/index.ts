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

export interface StorageDriver {
  readonly name: 'local' | 'supabase';
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  /** Absolute URL when the driver serves files directly, else null. */
  publicUrl(key: string): string | null;
}

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
  cachedDriver ??= env.storage.driver === 'supabase' ? createSupabaseDriver() : localDriver;
  return cachedDriver;
}
