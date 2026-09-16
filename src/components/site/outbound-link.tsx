'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { outboundLinkProps } from '@/lib/utils';

/**
 * An outbound link that behaves sensibly for email addresses.
 *
 * Web URLs open in a new tab. For `mailto:` the browser hands off to the
 * visitor's mail app — but when none is registered (browser-based Gmail on
 * Windows, for example) that click silently does nothing. So the address is
 * also copied to the clipboard and a short confirmation shown, which means the
 * click is useful either way. Default navigation is not prevented, so a mail
 * app still opens where one exists.
 */
export function OutboundLink({
  href,
  className,
  children,
  'aria-label': ariaLabel,
  title,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
  title?: string;
}) {
  const isMail = /^mailto:/i.test(href);
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
      // Clipboard unavailable (insecure context or denied) — the mailto
      // navigation still proceeds, so there is nothing further to do.
    }
  }

  return (
    <span className="relative inline-flex">
      <a
        href={href}
        {...outboundLinkProps(href)}
        onClick={isMail ? copyAddress : undefined}
        aria-label={ariaLabel}
        title={isMail ? (title ?? 'Email — also copies the address') : title}
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
