import { randomUUID } from 'node:crypto';

/**
 * Upload policy — pure, dependency-free, and therefore unit-testable.
 * The driver in ./index.ts enforces it before any bytes are written.
 */

export const IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
] as const;

export const DOCUMENT_TYPES = ['application/pdf'] as const;

/**
 * SVG is deliberately excluded: it can carry inline <script>, and these files
 * are served from the site's own origin.
 */
export const ALLOWED_TYPES: readonly string[] = [...IMAGE_TYPES, ...DOCUMENT_TYPES];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
};

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

export interface UploadCandidate {
  type: string;
  size: number;
}

/**
 * Validates an upload and returns a safe storage key.
 *
 * The client-supplied filename never becomes part of the key: it is a UUID
 * plus an extension derived from the *validated* MIME type, so path traversal
 * and double-extension tricks are impossible by construction.
 */
export function validateUpload(file: UploadCandidate): { key: string; extension: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadError(
      `Unsupported file type "${file.type || 'unknown'}". Allowed: JPEG, PNG, WebP, AVIF, GIF and PDF.`,
    );
  }

  const isDocument = (DOCUMENT_TYPES as readonly string[]).includes(file.type);
  const limit = isDocument ? MAX_DOCUMENT_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    throw new UploadError(
      `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${limit / 1024 / 1024} MB.`,
    );
  }
  if (file.size <= 0) throw new UploadError('File is empty.');

  const extension = EXTENSION_BY_TYPE[file.type] ?? 'bin';
  return { key: `${new Date().getFullYear()}/${randomUUID()}.${extension}`, extension };
}
