import { NextResponse } from 'next/server';

import { getMedia } from '@/lib/services/media';
import { getStorage } from '@/lib/storage';

/**
 * Serves a stored file by its media id.
 *
 * The URL never exposes a storage path, so it cannot be manipulated to reach
 * another object: the id is looked up in the database and the storage key comes
 * from that row. Remote drivers redirect to their own public URL rather than
 * proxying bytes through the server.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const mediaId = Number(id);
  if (!Number.isInteger(mediaId) || mediaId <= 0) {
    return new NextResponse('Not found', { status: 404 });
  }

  const item = await getMedia(mediaId);
  if (!item) return new NextResponse('Not found', { status: 404 });

  const storage = getStorage();

  if (item.driver !== 'local') {
    const direct = storage.publicUrl(item.storageKey);
    if (direct) return NextResponse.redirect(direct, 308);
  }

  const data = await storage.get(item.storageKey);
  if (!data) return new NextResponse('Not found', { status: 404 });

  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': item.mimeType,
      'Content-Length': String(data.byteLength),
      // Content is immutable for a given id: a replacement upload gets a new id.
      'Cache-Control': 'public, max-age=31536000, immutable',
      // Never let a stored file be interpreted as markup on our own origin.
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      'Content-Disposition': `inline; filename="${encodeURIComponent(item.filename)}"`,
    },
  });
}
