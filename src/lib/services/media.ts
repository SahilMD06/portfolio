import 'server-only';

import { desc, eq } from 'drizzle-orm';

import { TAGS, revalidateEntity } from '@/lib/cache';
import { getDb } from '@/lib/db';
import { media, type Media } from '@/lib/db/schema';
import { getStorage, validateUpload } from '@/lib/storage';
import type { MediaOption } from '@/types';

/**
 * Media = a row of metadata in Postgres + the bytes in object storage.
 * The binary itself is never stored in the database.
 */

export async function listMedia(limit = 200): Promise<Media[]> {
  const db = await getDb();
  return db.select().from(media).orderBy(desc(media.id)).limit(limit);
}

export async function getMedia(id: number): Promise<Media | null> {
  const db = await getDb();
  const rows = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Validates, writes to storage, then records metadata. Throws UploadError. */
export async function uploadMedia(file: File, alt?: string): Promise<Media> {
  const { key } = validateUpload(file);
  const storage = getStorage();
  const buffer = Buffer.from(await file.arrayBuffer());

  await storage.put(key, buffer, file.type);

  const db = await getDb();
  const rows = await db
    .insert(media)
    .values({
      filename: file.name.slice(0, 255),
      mimeType: file.type,
      size: buffer.byteLength,
      storageKey: key,
      driver: storage.name,
      alt: alt?.slice(0, 300) ?? null,
    })
    .returning();

  const created = rows[0];
  if (!created) {
    // Metadata insert failed — do not leave an orphaned object behind.
    await storage.delete(key);
    throw new Error('Failed to record uploaded file.');
  }

  revalidateEntity([TAGS.media]);
  return created;
}

/** Removes the stored object first, then the row, so no orphan bytes remain. */
export async function deleteMedia(id: number): Promise<boolean> {
  const existing = await getMedia(id);
  if (!existing) return false;

  await getStorage().delete(existing.storageKey);

  const db = await getDb();
  await db.delete(media).where(eq(media.id, id));
  revalidateEntity([TAGS.media, TAGS.profile, TAGS.projects, TAGS.experiences]);
  return true;
}

/**
 * URL a browser should use for a media row. Remote drivers expose a direct
 * public URL; the local driver streams through /media/[id].
 */
export function mediaUrl(item: Pick<Media, 'id' | 'driver' | 'storageKey'> | null): string | null {
  if (!item) return null;
  const storage = getStorage();
  if (item.driver === storage.name) {
    const direct = storage.publicUrl(item.storageKey);
    if (direct) return direct;
  }
  return `/media/${item.id}`;
}

/** Loads a media row shaped for the admin MediaPicker component. */
export async function toMediaOption(id: number | null | undefined): Promise<MediaOption | null> {
  if (!id) return null;
  const file = await getMedia(id);
  if (!file) return null;
  return {
    id: file.id,
    filename: file.filename,
    mimeType: file.mimeType,
    url: mediaUrl(file) ?? `/media/${file.id}`,
  };
}
