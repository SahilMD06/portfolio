'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';

import { Button, Card } from '@/components/ui';
import { FileIcon } from '@/components/ui/icons';
import { setResume, uploadFile } from '@/lib/actions/admin';
import type { MediaOption } from '@/types';
import { useToast } from './toast';

/**
 * Uploads a resume PDF and links it to the profile in one step, so the public
 * buttons appear as soon as the upload finishes.
 */
export function ResumeManager({ resume }: { resume: MediaOption | null }) {
  const [current, setCurrent] = useState<MediaOption | null>(resume);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();

  function upload(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    startTransition(async () => {
      const uploaded = await uploadFile({ ok: false }, formData);
      if (!uploaded.ok || !uploaded.mediaId) {
        toast('error', uploaded.message ?? 'Upload failed.');
        if (inputRef.current) inputRef.current.value = '';
        return;
      }

      const linked = await setResume(uploaded.mediaId);
      if (linked.ok) {
        setCurrent({
          id: uploaded.mediaId,
          filename: file.name,
          mimeType: file.type,
          url: `/media/${uploaded.mediaId}`,
        });
        toast('success', 'Resume updated and published.');
        router.refresh();
      } else {
        toast('error', linked.message ?? 'Could not link the resume.');
      }
      if (inputRef.current) inputRef.current.value = '';
    });
  }

  function clear() {
    startTransition(async () => {
      const result = await setResume(null);
      if (result.ok) {
        setCurrent(null);
        toast('success', 'Resume removed from the portfolio.');
        router.refresh();
      } else {
        toast('error', result.message ?? 'Could not remove the resume.');
      }
    });
  }

  return (
    <Card className="p-5">
      {current ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-bg p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded border border-border text-fg-subtle">
            <FileIcon width="18" height="18" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{current.filename}</p>
            <a
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:underline"
            >
              Open current resume
            </a>
          </div>
        </div>
      ) : (
        <p className="text-sm text-fg-muted">
          No resume uploaded yet. The Resume buttons stay hidden until you add one.
        </p>
      )}

      <input
        ref={inputRef}
        id="resume-file"
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
        }}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" disabled={pending} onClick={() => inputRef.current?.click()}>
          {pending ? 'Working…' : current ? 'Replace resume' : 'Upload resume'}
        </Button>
        {current ? (
          <Button type="button" variant="secondary" disabled={pending} onClick={clear}>
            Remove
          </Button>
        ) : null}
      </div>

      <p className="mt-3 text-xs text-fg-subtle">PDF only, up to 10 MB.</p>
    </Card>
  );
}
