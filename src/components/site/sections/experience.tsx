import Image from 'next/image';
import type { CSSProperties } from 'react';

import { Section, SectionHeading, TechChip } from '@/components/ui';
import { ArrowUpRightIcon, CheckIcon } from '@/components/ui/icons';
import { getExperiences } from '@/lib/services/content';
import { mediaUrl } from '@/lib/services/media';
import { isResearch } from '@/lib/portfolio';
import { formatPartialDate, outboundLinkProps, toParagraphs } from '@/lib/utils';

/**
 * Editorial timeline. Dates sit in their own column on wide screens; a thin
 * rail runs between the columns and fills as the section scrolls past (CSS
 * scroll-driven animation — static where unsupported or with reduced motion).
 * Research roles are shown in their own section instead.
 */
export async function Experience({ index }: { index: string }) {
  const experiences = (await getExperiences()).filter((item) => !isResearch(item));
  if (experiences.length === 0) return null;

  return (
    <Section id="experience">
      <SectionHeading
        index={index}
        eyebrow="Experience"
        title="Internships & roles."
      />

      <ol className="timeline-root relative">
        {/* Rail + progress fill. */}
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 left-[5px] w-px bg-border md:left-[calc(11rem+5px)]"
        />
        <span
          aria-hidden="true"
          className="timeline-progress absolute top-2 bottom-2 left-[5px] w-px bg-gradient-to-b from-accent via-accent/60 to-transparent md:left-[calc(11rem+5px)]"
        />

        {experiences.map((item, i) => {
          const logo = mediaUrl(item.logo);
          const document = mediaUrl(item.document);
          const paragraphs = toParagraphs(item.description);

          return (
            <li
              key={item.id}
              data-reveal=""
              style={{ '--i': Math.min(i, 3) } as CSSProperties}
              className="relative grid grid-cols-1 gap-3 pb-12 pl-8 last:pb-0 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-10 md:pl-0"
            >
              {/* Node on the rail. */}
              <span
                aria-hidden="true"
                className={
                  'absolute top-[0.45rem] left-0 h-[11px] w-[11px] rounded-full border-2 border-bg md:left-[11rem] ' +
                  (item.isCurrent ? 'bg-accent ring-4 ring-accent/15' : 'bg-border-strong')
                }
              />

              <div className="md:pt-0.5 md:pr-6 md:text-right">
                {/* Each end of the range stays whole; wrapping only happens at the dash. */}
                <p className="t-label text-fg-muted">
                  <span className="whitespace-nowrap">{formatPartialDate(item.startDate)}</span>{' '}
                  <span className="whitespace-nowrap">
                    — {item.isCurrent ? 'Present' : formatPartialDate(item.endDate) || '—'}
                  </span>
                </p>
                <p className="mt-1.5 text-xs text-fg-subtle">
                  {[item.employmentType, item.location].filter(Boolean).join(' · ')}
                </p>
              </div>

              <div className="min-w-0 md:pl-6">
                <div className="flex items-start gap-3">
                  {logo ? (
                    <Image
                      src={logo}
                      alt={`${item.company} logo`}
                      width={40}
                      height={40}
                      className="h-10 w-10 shrink-0 rounded-lg border border-border object-contain"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <h3 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[1.15rem] leading-snug">
                      {item.role}
                      {item.isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-line bg-accent-subtle px-2 py-0.5 text-[0.7rem] font-medium text-accent">
                          <span className="status-dot" aria-hidden="true" />
                          Current
                        </span>
                      ) : null}
                    </h3>
                    <p className="mt-1 text-[0.95rem] text-fg-muted">{item.company}</p>
                  </div>
                </div>

                {paragraphs.length > 0 ? (
                  <div className="prose-content mt-4 max-w-2xl text-[0.95rem]">
                    {paragraphs.map((paragraph, p) => (
                      <p key={p}>{paragraph}</p>
                    ))}
                  </div>
                ) : null}

                {item.responsibilities.length > 0 ? (
                  <ul className="mt-4 max-w-2xl space-y-2.5">
                    {item.responsibilities.map((entry, r) => (
                      <li key={r} className="flex gap-3 text-[0.925rem] leading-relaxed text-fg-muted">
                        <span
                          aria-hidden="true"
                          className="mt-[0.7rem] h-px w-3 shrink-0 bg-border-strong"
                        />
                        <span>{entry}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {item.achievements.length > 0 ? (
                  <ul className="mt-4 max-w-2xl space-y-2">
                    {item.achievements.map((entry, a) => (
                      <li key={a} className="flex gap-3 text-[0.925rem] leading-relaxed text-fg">
                        <CheckIcon
                          width="15"
                          height="15"
                          className="mt-1 shrink-0 text-accent"
                        />
                        <span>{entry}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {item.technologies.length > 0 || document ? (
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {item.technologies.map((tech) => (
                      <TechChip key={tech}>{tech}</TechChip>
                    ))}
                    {document ? (
                      <a
                        href={document}
                        {...outboundLinkProps(document)}
                        className="group ml-1 inline-flex items-center gap-1 text-sm text-accent"
                      >
                        <span className="link-underline">Certificate</span>
                        <ArrowUpRightIcon width="14" height="14" className="arrow-nudge-diag arrow-nudge" />
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
