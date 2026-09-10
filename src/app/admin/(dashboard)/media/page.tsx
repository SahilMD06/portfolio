import { MediaLibrary } from '@/components/admin/media-library';
import { requireAdminPage } from '@/lib/auth/guard';
import { listMedia, mediaUrl } from '@/lib/services/media';

export const metadata = { title: 'Media' };

export default async function AdminMediaPage() {
  await requireAdminPage();
  const files = await listMedia();

  const items = files.map((file) => ({
    id: file.id,
    filename: file.filename,
    mimeType: file.mimeType,
    size: file.size,
    url: mediaUrl(file) ?? `/media/${file.id}`,
  }));

  return (
    <>
      <header className="mb-6">
        <h1 className="text-xl font-semibold">Media</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Every uploaded file. Deleting one also removes it from the storage bucket.
        </p>
      </header>

      <MediaLibrary items={items} />
    </>
  );
}
