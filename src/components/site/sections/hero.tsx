import { Suspense, type CSSProperties } from 'react';

import { Container } from '@/components/ui';
import { ArrowRightIcon, DownloadIcon, SocialIcon } from '@/components/ui/icons';
import { OutboundLink } from '@/components/site/outbound-link';
import {
  getCertifications,
  getEducation,
  getExperiences,
  getProfile,
  getPublishedProjects,
  getResumeMedia,
  getSocialLinks,
} from '@/lib/services/content';
import { mediaUrl } from '@/lib/services/media';
import { gradeStat, isResearch, splitDotList, splitRole } from '@/lib/portfolio';
import { formatPartialDate } from '@/lib/utils';

const delay = (ms: number) => ({ '--enter-delay': `${ms}ms` }) as CSSProperties;

/**
 * First viewport. Rendered eagerly (not behind Suspense) so it paints at once;
 * the status panel and stats strip stream in beside it.
 *
 * Entrance is pure CSS, staggered: backdrop → status → name → headline →
 * intro → actions → panel → stats.
 */
export async function Hero() {
  const [profile, links, resume] = await Promise.all([
    getProfile(),
    getSocialLinks(),
    getResumeMedia(),
  ]);

  const resumeHref = mediaUrl(resume);
  const headlineParts = splitDotList(profile.headline);

  return (
    <section
      className="relative isolate overflow-hidden border-b border-border"
      data-spotlight-group=""
      data-spotlight=""
    >
      {/* Backdrop: a grid that lights up around the cursor, and one soft light. */}
      <div aria-hidden="true" className="enter-fade absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 55% at 50% -10%, var(--color-accent-subtle), transparent 70%)',
          }}
        />
        <div className="grid-backdrop" />
        <div className="grid-backdrop grid-backdrop-lit" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-bg" />
      </div>

      <Container className="pt-[clamp(4rem,2.5rem+6vw,8rem)] pb-[clamp(3rem,2rem+4vw,5rem)]">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            {profile.availability ? (
              <p
                className="enter mb-7 inline-flex max-w-full items-center gap-2.5 rounded-full border border-border bg-surface/70 py-1.5 pr-3.5 pl-3 text-[0.8rem] text-fg-muted backdrop-blur"
                style={delay(120)}
              >
                <span className="status-dot shrink-0" aria-hidden="true" />
                <span className="min-w-0">{profile.availability}</span>
              </p>
            ) : null}

            <h1 className="t-display enter" style={delay(220)}>
              {profile.fullName}
            </h1>

            {headlineParts.length > 0 ? (
              <p
                className="enter mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[clamp(1.1rem,0.95rem+0.8vw,1.5rem)] font-medium tracking-tight"
                style={delay(320)}
              >
                {headlineParts.map((part, index) => (
                  <span key={part} className="inline-flex items-center gap-3">
                    {index > 0 ? (
                      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-accent" />
                    ) : null}
                    <span className={index === 0 ? 'text-fg' : 'text-fg-muted'}>{part}</span>
                  </span>
                ))}
              </p>
            ) : null}

            {profile.shortBio ? (
              <p className="t-lead enter mt-6 max-w-xl" style={delay(420)}>
                {profile.shortBio}
              </p>
            ) : null}

            <div className="enter mt-9 flex flex-wrap items-center gap-3" style={delay(520)}>
              <a href="#projects" className="btn btn-primary">
                View my work
                <ArrowRightIcon width="15" height="15" className="arrow-nudge" />
              </a>
              {resumeHref ? (
                <a
                  href={resumeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  <DownloadIcon width="15" height="15" />
                  Resume
                </a>
              ) : null}
              <a href="#contact" className="btn btn-ghost">
                Get in touch
              </a>
            </div>

            {links.length > 0 ? (
              <ul
                className="enter mt-9 flex flex-wrap items-center gap-x-6 gap-y-3"
                style={delay(620)}
              >
                {links.map((link) => (
                  <li key={link.id}>
                    <OutboundLink
                      href={link.url}
                      className="group inline-flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
                    >
                      <SocialIcon
                        platform={link.platform}
                        width="15"
                        height="15"
                        className="transition-transform duration-200 group-hover:-translate-y-px"
                      />
                      <span className="link-underline">{link.label}</span>
                    </OutboundLink>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="enter" style={delay(560)}>
            <Suspense fallback={<div className="surface h-72" aria-hidden="true" />}>
              <StatusPanel />
            </Suspense>
          </div>
        </div>

        <div className="enter mt-16 sm:mt-20" style={delay(700)}>
          <Suspense fallback={<div className="h-20" aria-hidden="true" />}>
            <HeroStats />
          </Suspense>
        </div>
      </Container>
    </section>
  );
}

/**
 * A compact "now" readout — current role, research, focus, location — drawn
 * from the database. It doubles as the hero's technical visual element.
 */
async function StatusPanel() {
  const [profile, experiences] = await Promise.all([getProfile(), getExperiences()]);
  const current = experiences.find((item) => item.isCurrent && !isResearch(item));
  const research = experiences.find(isResearch);
  const researchRole = research ? splitRole(research.role) : null;

  const rows = [
    current
      ? {
          label: 'Now',
          value: current.role,
          meta: `${current.company} · since ${formatPartialDate(current.startDate)}`,
        }
      : null,
    research && researchRole
      ? { label: 'Research', value: researchRole.topic ?? researchRole.title, meta: research.company }
      : null,
    profile.currentFocus ? { label: 'Focus', value: profile.currentFocus, meta: null } : null,
    profile.location ? { label: 'Based in', value: profile.location, meta: null } : null,
  ].filter((row): row is { label: string; value: string; meta: string | null } => row !== null);

  if (rows.length === 0) return null;

  return (
    <div className="surface spotlight overflow-hidden" data-spotlight="">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-surface-3" />
          <span className="h-2 w-2 rounded-full bg-surface-3" />
          <span className="h-2 w-2 rounded-full bg-surface-3" />
        </span>
        <span className="t-label flex items-center gap-2">
          <span className="status-dot" aria-hidden="true" />
          Status
        </span>
      </div>
      <dl className="divide-y divide-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 px-5 py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)]"
          >
            <dt className="t-label pt-0.5">{row.label}</dt>
            <dd className="min-w-0">
              <p className="text-[0.925rem] leading-snug text-fg">{row.value}</p>
              {row.meta ? <p className="mt-1 text-xs text-fg-subtle">{row.meta}</p> : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Headline numbers, counted from real records rather than typed in. */
async function HeroStats() {
  const [projects, experiences, certifications, education] = await Promise.all([
    getPublishedProjects(),
    getExperiences(),
    getCertifications(),
    getEducation(),
  ]);

  const roles = experiences.filter((item) => !isResearch(item)).length;
  const grade = education
    .map((item) => gradeStat(item.grade))
    .find((stat) => stat?.label.toUpperCase() === 'CGPA');

  const stats = [
    grade ? { value: grade.value, suffix: grade.suffix, label: grade.label } : null,
    projects.length ? { value: String(projects.length), suffix: '', label: 'Projects' } : null,
    roles ? { value: String(roles), suffix: '', label: 'Internships & roles' } : null,
    certifications.length
      ? { value: String(certifications.length), suffix: '', label: 'Certifications' }
      : null,
  ].filter((stat): stat is { value: string; suffix: string; label: string } => stat !== null);

  if (stats.length === 0) return null;

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border pt-8 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-2.5">
          <dt className="t-label order-2">{stat.label}</dt>
          <dd className="order-1 text-[clamp(1.75rem,1.4rem+1.2vw,2.5rem)] leading-none font-semibold tracking-tight tabular-nums">
            {stat.value}
            {stat.suffix ? (
              <span className="ml-1.5 text-[0.45em] font-normal tracking-normal text-fg-subtle">
                {stat.suffix}
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
