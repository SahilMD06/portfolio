'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Card, EmptyState } from '@/components/ui';
import { FileIcon } from '@/components/ui/icons';
import { deleteFile } from '@/lib/actions/admin';
import { ConfirmDelete } from './confirm-delete';

interface MediaItem {
  id: number;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaLibrary({ items }: { items: MediaItem[] }) {
  const router = useRouter();

  if (items.length === 0) {
    return (
      <EmptyState
        title="No files uploaded yet"
        description="Files uploaded from a project, experience or the resume page appear here."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const isImage = item.mimeType.startsWith('image/');
        return (
          <Card key={item.id} className="flex flex-col overflow-hidden">
            <div className="flex h-32 items-center justify-center border-b border-border bg-surface-2">
              {isImage ? (
                <Image
                  src={item.url}
                  alt=""
                  width={200}
                  height={128}
                  className="h-32 w-full object-cover"
                  unoptimized
                />
              ) : (
                <FileIcon width="28" height="28" className="text-fg-subtle" />
              )}
            </div>

            <div className="flex flex-1 flex-col p-3">
              <p className="truncate text-sm font-medium" title={item.filename}>
                {item.filename}
              </p>
              <p className="mt-0.5 font-mono text-xs text-fg-subtle">
                {item.mimeType} · {formatSize(item.size)}
              </p>

              <div className="mt-3 flex items-center justify-between gap-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline"
                >
                  Open
                </a>
                <ConfirmDelete
                  label="Delete file"
                  itemName={item.filename}
                  action={() => deleteFile(item.id)}
                  onDeleted={() => router.refresh()}
                />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
