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
  if (!to || to === from) return from;
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

/**
 * Attributes for an outbound link.
 *
 * Web URLs open in a new tab. `mailto:` and `tel:` must NOT: a new tab for them
 * is left blank, and when no mail or phone handler is registered (common with
 * browser-based Gmail on Windows) nothing else happens — a dead tab. In the
 * same tab the browser hands off to the handler without navigating away.
 */
export function outboundLinkProps(href: string): { target?: '_blank'; rel?: string } {
  if (/^(mailto|tel):/i.test(href.trim())) return {};
  return { target: '_blank', rel: 'noopener noreferrer' };
}

/**
 * Turns a `mailto:` link into a Gmail compose URL with the recipient in "To:".
 *
 * A bare mailto: only works when the visitor has a mail app registered, which
 * many browser-based Gmail users on Windows do not — the click does nothing.
 * Gmail's compose URL opens a ready-to-write email in the browser instead.
 * Subject, body and cc/bcc from the mailto: query are carried across.
 */
export function gmailComposeUrl(mailto: string): string {
  const [target = '', query = ''] = mailto.replace(/^mailto:/i, '').split('?');
  const params = new URLSearchParams({ view: 'cm', fs: '1', to: decodeURIComponent(target) });
  const source = new URLSearchParams(query);
  const map: Record<string, string> = { subject: 'su', body: 'body', cc: 'cc', bcc: 'bcc' };
  for (const [key, value] of source) {
    const mapped = map[key.toLowerCase()];
    if (mapped) params.set(mapped, value);
  }
  return `https://mail.google.com/mail/?${params.toString()}`;
}
