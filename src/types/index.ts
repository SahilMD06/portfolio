/** Shared across server and client components, so it lives outside both. */
export interface MediaOption {
  id: number;
  filename: string;
  mimeType: string;
  url: string;
}
