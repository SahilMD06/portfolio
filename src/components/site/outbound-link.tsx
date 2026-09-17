'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { cn, gmailComposeUrl, outboundLinkProps } from '@/lib/utils';

/**
 * An outbound link that behaves sensibly for email addresses.
 *
 * Web URLs open in a new tab. A `mailto:` link is rewritten to Gmail's compose
 * URL and opened in a new tab, so clicking "Email" always lands on a new email
 * with the address already in To:. A bare mailto: only works when the visitor
 * has a mail app registered; many browser-based Gmail users do not, and the
 * click would silently do nothing.
 *
 * The address is also copied to the clipboard, so a visitor who uses another
 * mail provider can paste it straight into their own client.
 */
export function OutboundLink({
  href,
  className,
  wrapperClassName,
  children,
  'aria-label': ariaLabel,
  title,
}: {
  href: string;
  className?: string;
  /** Classes for the positioning wrapper, e.g. `flex w-full` for block rows. */
  wrapperClassName?: string;
  children: ReactNode;
  'aria-label'?: string;
  title?: string;
}) {
  const isMail = /^mailto:/i.test(href);
  const resolvedHref = isMail ? gmailComposeUrl(href) : href;
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copyAddress() {
    const address = decodeURIComponent(href.replace(/^mailto:/i, '').split('?')[0] ?? '');
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard unavailable (insecure context or denied) — the compose
      // tab still opens, so there is nothing further to do.
    }
  }

  return (
    <span className={cn('relative inline-flex', wrapperClassName)}>
      <a
        href={resolvedHref}
        {...outboundLinkProps(resolvedHref)}
        onClick={isMail ? copyAddress : undefined}
        aria-label={ariaLabel}
        title={isMail ? (title ?? 'Write an email in Gmail (address is also copied)') : title}
        className={className}
      >
        {children}
      </a>
      {isMail ? (
        <span
          role="status"
          aria-live="polite"
          className={
            'pointer-events-none absolute top-full left-1/2 z-20 mt-1.5 -translate-x-1/2 rounded-md bg-fg px-2 py-1 text-xs whitespace-nowrap text-bg shadow-sm transition-opacity duration-150 ' +
            (copied ? 'opacity-100' : 'opacity-0')
          }
        >
          {copied ? 'Email copied' : ''}
        </span>
      ) : null}
    </span>
  );
}
