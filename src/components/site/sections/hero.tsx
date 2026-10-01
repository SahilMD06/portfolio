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
  getSkillGroups,
  getSocialLinks,
} from '@/lib/services/content';
import { mediaUrl } from '@/lib/services/media';
import { gradeStat, isResearch, splitDotList, splitRole } from '@/lib/portfolio';
import { formatPartialDate } from '@/lib/utils';

const delay = (ms: number) => ({ '--enter-delay': `${ms}ms` }) as CSSProperties;

/**
 * First viewport, composed as an editorial spread rather than a two-column
 * hero: the name is the anchor, technical annotations sit in the margin, and
 * the status panel hangs lower than the text column.
 *
 * Entrance is pure CSS, staggered: backdrop → annotations → name lines →
 * headline → intro → actions → panel → figures.
 */
export async function Hero() {
  const [profile, links, resume] = await Promise.all([
    getProfile(),
    getSocialLinks(),
    getResumeMedia(),
  ]);

  const resumeHref = mediaUrl(resume);
  const headlineParts = splitDotList(profile.headline);
  const [discipline, ...specialisms] = headlineParts;
  const nameLines = profile.fullName.split(/\s+/).filter(Boolean);
  /* Margin annotations are the headline's own terms, not invented labels. */
  const annotations = headlineParts.flatMap((part) => part.split(/,| & /)).map((p) => p.trim()).filter(Boolean);

  return (
    <section
      className="relative isolate overflow-hidden"
      data-spotlight-group=""
      data-spotlight=""
    >
      <div aria-hidden="true" className="enter-fade absolute inset-0 -z-10">
        <div className="ambient">
          <i />
          <i />
        </div>
        <div className="grid-backdrop parallax-slow opacity-70" />
        <div className="grid-backdrop grid-backdrop-lit" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-bg" />
      </div>

      <Container className="pt-[clamp(4.5rem,3rem+7vw,9rem)] pb-[clamp(3rem,2rem+4vw,5.5rem)]">
        <div className="grid grid-cols-1 gap-y-14 lg:grid-cols-12 lg:gap-x-10">
          {/* Margin: availability and the technical terms from the headline. */}
          <div className="lg:col-span-12">
            {profile.availability ? (
              <p className="enter flex items-center gap-3 text-[0.82rem] text-fg-muted" style={delay(80)}>
                <span className="status-dot shrink-0" aria-hidden="true" />
                <span className="min-w-0">{profile.availability}</span>
              </p>
            ) : null}
          </div>

          <div className="lg:col-span-6 lg:col-start-1">
            <h1 className="t-display reveal-lines -ml-[0.06em]" style={delay(180)}>
              {nameLines.map((word, index) => (
                <span key={`${word}-${index}`}>
                  <span style={{ '--line': index } as CSSProperties}>{word}</span>
                </span>
              ))}
            </h1>

            {discipline ? (
              <p
                className="enter mt-7 max-w-xl text-[clamp(1.15rem,1rem+0.9vw,1.6rem)] leading-snug font-light tracking-tight text-fg"
                style={delay(560)}
              >
                {discipline}
                {specialisms.length > 0 ? (
                  <>
                    <span className="text-fg-subtle"> — </span>
                    <span className="font-light text-fg-muted">{specialisms.join(', ')}</span>
                  </>
                ) : null}
              </p>
            ) : null}

            {profile.shortBio ? (
              <p className="t-lead enter mt-6 max-w-lg" style={delay(660)}>
                {profile.shortBio}
              </p>
            ) : null}

            <div className="enter mt-10 flex flex-wrap items-center gap-3" style={delay(760)}>
              <a href="#projects" className="btn btn-primary magnetic" data-magnetic="">
                View my work
                <ArrowRightIcon width="15" height="15" className="arrow-nudge" />
              </a>
              {resumeHref ? (
                <a
                  href={resumeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary magnetic"
                  data-magnetic=""
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
              <ul className="enter mt-9 flex flex-wrap items-center gap-x-7 gap-y-3" style={delay(840)}>
                {links.map((link) => (
                  <li key={link.id}>
                    <OutboundLink
                      href={link.url}
                      className="group inline-flex items-center gap-2 text-[0.85rem] text-fg-muted transition-colors hover:text-fg"
                    >
                      <SocialIcon
                        platform={link.platform}
                        width="14"
                        height="14"
                        className="transition-transform duration-200 group-hover:-translate-y-px"
                      />
                      <span className="link-underline">{link.label}</span>
                    </OutboundLink>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* The panel sits lower than the text column, which breaks the grid. */}
          <div className="enter lg:col-span-5 lg:col-start-8 lg:pt-20" style={delay(700)}>
            <Suspense fallback={<div className="surface h-72" aria-hidden="true" />}>
              <StatusPanel />
            </Suspense>

            {annotations.length > 0 ? (
              <ul className="mt-8 hidden flex-col gap-2.5 lg:flex">
                {annotations.slice(0, 5).map((term) => (
                  <li key={term} className="t-annotation">
                    {term}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="enter mt-[clamp(3.5rem,2rem+5vw,6rem)]" style={delay(900)}>
          <Suspense fallback={<div className="h-20" aria-hidden="true" />}>
            <HeroStats />
          </Suspense>
        </div>
      </Container>

      <div className="enter-fade mt-12 border-t border-border py-4" style={delay(1100)}>
        <Suspense fallback={<div className="h-6" aria-hidden="true" />}>
          <TechMarquee />
        </Suspense>
      </div>
    </section>
  );
}

/**
 * A compact "now" readout — current role, research, focus, location — drawn
 * from the database. It doubles as the hero's technical instrument.
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
    <div
      data-spotlight=""
      className="surface spotlight edge-gradient group relative overflow-hidden rounded-none rounded-tr-xl rounded-bl-xl transition-transform duration-500 hover:-translate-y-1"
    >
      <div className="flex items-center justify-between px-5 py-3.5">
        <span className="t-label">Status</span>
        <span className="flex items-center gap-2 text-[0.68rem] tracking-[0.14em] text-fg-subtle uppercase">
          <span className="status-dot" aria-hidden="true" />
          Live
        </span>
      </div>
      <div className="hairline" />
      <dl>
        {rows.map((row, index) => (
          <div
            key={row.label}
            className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-5 px-6 py-4 transition-colors duration-300 group-hover:bg-surface-2/40"
            style={{ transitionDelay: `${index * 40}ms` }}
          >
            <dt className="t-label pt-0.5">{row.label}</dt>
            <dd className="min-w-0">
              <p className="text-[0.92rem] leading-snug font-light text-fg">{row.value}</p>
              {row.meta ? <p className="mt-1 text-xs text-fg-subtle">{row.meta}</p> : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Headline figures, counted from real records rather than typed in. */
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
    <dl className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-3 border-t border-border pt-5">
          <dd className="text-[clamp(1.9rem,1.4rem+1.5vw,2.75rem)] leading-none font-light tracking-[-0.03em] tabular-nums">
            <span data-count={stat.value}>{stat.value}</span>
            {stat.suffix ? (
              <span className="ml-1.5 text-[0.4em] font-normal tracking-normal text-fg-subtle">
                {stat.suffix}
              </span>
            ) : null}
          </dd>
          <dt className="t-label">{stat.label}</dt>
        </div>
      ))}
    </dl>
  );
}

/**
 * A slow band of the technologies in the database, looping under the hero.
 * The second copy is aria-hidden so the list is announced once, and the
 * animation pauses on hover and stops entirely when motion is off.
 */
async function TechMarquee() {
  const groups = await getSkillGroups();
  const names = groups.flatMap((group) => group.skills.map((skill) => skill.name));
  if (names.length < 6) return null;

  const row = (hidden: boolean) => (
    <ul className="marquee-track" aria-hidden={hidden || undefined}>
      {names.map((name) => (
        <li
          key={name}
          className="flex items-center gap-2.5 font-mono text-[0.68rem] tracking-[0.12em] whitespace-nowrap text-fg-subtle uppercase"
        >
          <span className="h-[3px] w-[3px] rounded-full bg-accent/70" aria-hidden="true" />
          {name}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="marquee" aria-label="Technologies I work with">
      {row(false)}
      {row(true)}
    </div>
  );
}
