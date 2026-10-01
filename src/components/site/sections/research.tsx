import type { CSSProperties } from 'react';

import { Section, SectionHeading } from '@/components/ui';
import { ArrowUpRightIcon } from '@/components/ui/icons';
import { getExperiences } from '@/lib/services/content';
import { mediaUrl } from '@/lib/services/media';
import { isResearch, pad2, splitRole } from '@/lib/portfolio';
import { formatDateRange, outboundLinkProps, toParagraphs } from '@/lib/utils';

/**
 * Research set as a paper rather than a job entry: a title block with its
 * affiliation and dates in the margin, an abstract in a single measure, the
 * method as a numbered sequence, and the contribution pulled out as a quote.
 *
 * Labels map onto existing fields — description → abstract, responsibilities →
 * method, achievements → contribution, pipeline → stages. Nothing is added.
 */
export async function Research({ index }: { index: string }) {
  const items = (await getExperiences()).filter(isResearch);
  if (items.length === 0) return null;

  return (
    <Section id="research" spotlight className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="ambient">
          <i />
        </div>
      </div>

      <SectionHeading
        index={index}
        eyebrow="Research"
        title={
          <>
            Research <span className="t-em">work</span>.
          </>
        }
      />

      <div className="space-y-24">
        {items.map((item) => {
          const { title, topic } = splitRole(item.role);
          const abstract = toParagraphs(item.description);
          const document = mediaUrl(item.document);

          return (
            <article key={item.id} className="grid grid-cols-1 gap-x-16 gap-y-10 lg:grid-cols-12">
              {/* Margin: role, affiliation, period — the paper's masthead. */}
              <div className="lg:col-span-3" data-reveal="">
                <p className="t-label text-accent">{title}</p>
                <p className="mt-4 text-sm leading-relaxed text-fg-muted">
                  {[item.company, item.location].filter(Boolean).join(' · ')}
                </p>
                <p className="t-label mt-4">
                  {formatDateRange(item.startDate, item.endDate, item.isCurrent)}
                </p>

                {item.technologies.length > 0 ? (
                  <ul className="mt-8 space-y-2 border-t border-border pt-6">
                    {item.technologies.map((tech) => (
                      <li
                        key={tech}
                        className="font-mono text-[0.72rem] tracking-[0.04em] text-fg-subtle transition-colors duration-300 hover:text-fg-muted"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {document ? (
                  <a
                    href={document}
                    {...outboundLinkProps(document)}
                    className="group mt-8 inline-flex items-center gap-1.5 text-sm text-accent"
                  >
                    <span className="link-underline">View document</span>
                    <ArrowUpRightIcon width="14" height="14" className="arrow-nudge arrow-nudge-diag" />
                  </a>
                ) : null}
              </div>

              <div className="lg:col-span-8 lg:col-start-5">
                <h3
                  className="max-w-3xl text-[clamp(1.6rem,1.2rem+1.6vw,2.5rem)] leading-[1.12] font-light tracking-[-0.03em]"
                  data-reveal=""
                >
                  {topic ?? item.role}
                </h3>

                {abstract.length > 0 ? (
                  <div className="mt-7 max-w-[62ch]" data-reveal="">
                    {abstract.map((paragraph, i) => (
                      <p key={i} className="mt-4 leading-[1.75] font-light text-fg-muted first:mt-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : null}

                {item.pipeline.length > 0 ? (
                  <div className="mt-12" data-reveal="">
                    <p className="t-label mb-6">Method</p>
                    <ol className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-5">
                      {item.pipeline.map((stage, i) => (
                        <li
                          key={`${i}-${stage}`}
                          style={{ '--step': i } as CSSProperties}
                          className="group relative flex flex-col gap-3 bg-bg p-5 transition-colors duration-300 hover:bg-surface"
                        >
                          <span className="font-mono text-[0.7rem] text-accent tabular-nums">
                            {pad2(i + 1)}
                          </span>
                          <span className="text-[0.85rem] leading-snug font-light text-fg-muted transition-colors duration-300 group-hover:text-fg">
                            {stage}
                          </span>
                          <span
                            aria-hidden="true"
                            className="pipeline-connector absolute inset-x-0 bottom-0 h-px"
                          />
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                {item.achievements.length > 0 ? (
                  <div className="mt-12" data-reveal="">
                    <p className="t-label mb-5">Contribution</p>
                    <ul className="space-y-5">
                      {item.achievements.map((entry, i) => (
                        <li
                          key={i}
                          className="border-l border-accent pl-6 text-[1.02rem] leading-[1.7] font-light text-fg"
                        >
                          {entry}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {item.responsibilities.length > 0 ? (
                  <div className="mt-12" data-reveal="">
                    <p className="t-label mb-5">Approach</p>
                    <ol className="divide-y divide-border border-y border-border">
                      {item.responsibilities.map((entry, i) => (
                        <li key={i} className="flex gap-6 py-5">
                          <span className="mt-1 font-mono text-[0.7rem] text-fg-subtle tabular-nums">
                            {pad2(i + 1)}
                          </span>
                          <span className="text-[0.93rem] leading-[1.7] text-fg-muted">{entry}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
