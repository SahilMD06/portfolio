/**
 * Conditional class names. Small enough that clsx would not earn its place in
 * the bundle.
 */
export function cn(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(' ');
}

/** "2024-06" -> "Jun 2024"; "2024" -> "2024"; undefined -> "". */
export function formatPartialDate(value: string | null | undefined): string {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year) return '';
  if (!month) return year;
  const date = new Date(Number(year), Number(month) - 1, day ? Number(day) : 1);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
    ...(day ? { day: 'numeric' } : {}),
  });
}

/** "Jun 2024 — Aug 2024", or "Jun 2024 — Present" when ongoing. */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  isCurrent = false,
): string {
  const from = formatPartialDate(start);
  const to = isCurrent ? 'Present' : formatPartialDate(end);
  if (!from) return to;
  if (!to) return from;
  return `${from} — ${to}`;
}

/** Turns a title into a URL-safe slug matching `slugSchema`. */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 220);
}

/**
 * Splits database text into paragraphs for rendering.
 *
 * Content is always rendered as React text nodes, never with
 * dangerouslySetInnerHTML, so stored content cannot inject markup.
 */
export function toParagraphs(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
