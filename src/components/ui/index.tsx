import Link from 'next/link';
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';

import { cn, outboundLinkProps } from '@/lib/utils';

/**
 * Shared presentational primitives, built on the tokens and component classes
 * in globals.css. All server components — none of them ship JavaScript.
 */

/* -------------------------------------------------------------------------- */
/* Button                                                                     */
/* -------------------------------------------------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md') {
  return cn('btn', `btn-${variant}`, size === 'sm' && 'btn-sm');
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ComponentPropsWithoutRef<'button'> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={cn(buttonClass(variant, size), className)} {...props} />;
}

export function LinkButton({
  href,
  variant = 'primary',
  size = 'md',
  external = false,
  className,
  children,
  ...props
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  external?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<'a'>, 'href'>) {
  const classes = cn(buttonClass(variant, size), className);
  if (external) {
    return (
      // New tab for web URLs (noreferrer also blocks reverse-tabnabbing);
      // same tab for mailto:/tel:, which otherwise leave a dead blank tab.
      <a href={href} {...outboundLinkProps(href)} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('mx-auto w-full max-w-content px-5 sm:px-8', className)}>{children}</div>
  );
}

export function Section({
  id,
  className,
  children,
  spotlight = false,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  /** Enables the cursor spotlight for cards inside this section. */
  spotlight?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn('relative scroll-mt-20 py-[clamp(4.5rem,3rem+6vw,8rem)]', className)}
      {...(spotlight ? { 'data-spotlight-group': '' } : {})}
    >
      <Container>{children}</Container>
    </section>
  );
}

/**
 * Section header: a numbered mono label, a title, and an optional lead.
 * The numbering gives the page an editorial rhythm and makes position obvious.
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  index?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-reveal
      className={cn(
        'mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-5 sm:mb-14',
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="t-label mb-4 flex items-center gap-3">
            {index ? <span className="text-accent">{index}</span> : null}
            {index ? <span className="h-px w-8 bg-border-strong" aria-hidden="true" /> : null}
            <span>{eyebrow}</span>
          </p>
        ) : null}
        <h2 className="t-title">{title}</h2>
        {description ? <p className="t-lead mt-4 max-w-xl">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                   */
/* -------------------------------------------------------------------------- */

export function Card({
  className,
  children,
  interactive = false,
  spotlight = false,
  reveal = false,
  index,
  as: Tag = 'div',
}: {
  className?: string;
  children: ReactNode;
  /** Lifts slightly and strengthens its border on hover. */
  interactive?: boolean;
  /** Participates in the cursor spotlight of its section. */
  spotlight?: boolean;
  /** Fades in when scrolled into view. */
  reveal?: boolean;
  /** Stagger position when revealed alongside siblings. */
  index?: number;
  as?: 'div' | 'article' | 'li';
}) {
  return (
    <Tag
      className={cn(
        'surface',
        interactive && 'surface-interactive',
        spotlight && 'spotlight',
        className,
      )}
      {...(spotlight ? { 'data-spotlight': '' } : {})}
      {...(reveal ? { 'data-reveal': '' } : {})}
      style={index !== undefined ? ({ '--i': index } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}

export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode;
  tone?: 'default' | 'accent' | 'success' | 'danger';
  className?: string;
}) {
  const tones = {
    default: 'border-border bg-surface-2 text-fg-muted',
    accent: 'border-accent-line bg-accent-subtle text-accent',
    success: 'border-accent-line bg-success-subtle text-success',
    danger: 'border-transparent bg-danger-subtle text-danger',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Monospace chip used for technology lists. */
export function TechChip({ children }: { children: ReactNode }) {
  return <span className="chip chip-mono chip-lift">{children}</span>;
}

/* -------------------------------------------------------------------------- */
/* States                                                                     */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-surface-2', className)}
      aria-hidden="true"
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {description ? <p className="mt-1 text-sm text-fg-muted">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
