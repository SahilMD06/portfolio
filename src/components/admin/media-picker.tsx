'use client';

import Image from 'next/image';
import { useRef, useState, useTransition } from 'react';

import { Button } from '@/components/ui';
import { CloseIcon, FileIcon } from '@/components/ui/icons';
import { uploadFile } from '@/lib/actions/admin';
import type { MediaOption } from '@/types';
import { useToast } from './toast';

export type { MediaOption };



/**
 * Attaches a file to the field named by `name`.
 *
 * Uploads immediately (so the file exists before the parent form is saved) and
 * stores the resulting media id in a hidden input, which is what the entity
 * form actually submits.
 */
export function MediaPicker({
  name,
  label,
  hint,
  accept = 'image/*',
  initial,
}: {
  name: string;
  label: string;
  hint?: string;
  accept?: string;
  initial?: MediaOption | null;
}) {
  const [selected, setSelected] = useState<MediaOption | null>(initial ?? null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  function onFileChosen(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    startTransition(async () => {
      const result = await uploadFile({ ok: false }, formData);
      if (result.ok && result.mediaId) {
        setSelected({
          id: result.mediaId,
          filename: file.name,
          mimeType: file.type,
          url: `/media/${result.mediaId}`,
        });
        toast('success', result.message ?? 'File uploaded.');
      } else {
        toast('error', result.message ?? 'Upload failed.');
      }
      // Allow re-selecting the same file after a failure.
      if (inputRef.current) inputRef.current.value = '';
    });
  }

  const isImage = selected?.mimeType.startsWith('image/');

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>

      {/* What the parent form submits. */}
      <input type="hidden" name={name} value={selected?.id ?? ''} />

      {selected ? (
        <div className="mb-2 flex items-center gap-3 rounded-lg border border-border bg-bg p-2.5">
          {isImage ? (
            <Image
              src={selected.url}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded border border-border object-cover"
              unoptimized
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded border border-border text-fg-subtle">
              <FileIcon width="18" height="18" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{selected.filename}</p>
            <a
              href={selected.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:underline"
            >
              Preview
            </a>
          </div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label={`Remove ${selected.filename}`}
            className="rounded p-1 text-fg-subtle hover:text-danger"
          >
            <CloseIcon width="15" height="15" />
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          id={`${name}-file`}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFileChosen(file);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? 'Uploading…' : selected ? 'Replace file' : 'Upload file'}
        </Button>
      </div>

      {hint ? <p className="mt-1 text-xs text-fg-subtle">{hint}</p> : null}
    </div>
  );
}
