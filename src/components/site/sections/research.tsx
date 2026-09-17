import type { CSSProperties } from 'react';

import { Card, Section, SectionHeading, TechChip } from '@/components/ui';
import { ArrowUpRightIcon, FlaskIcon } from '@/components/ui/icons';
import { getExperiences } from '@/lib/services/content';
import { mediaUrl } from '@/lib/services/media';
import { isResearch, pad2, splitRole } from '@/lib/portfolio';
import { formatDateRange, outboundLinkProps, toParagraphs } from '@/lib/utils';

/**
 * Research work, presented as a technical brief rather than a job entry:
 * the topic leads, the pipeline stages render as a connected flow, and the
 * approach / contribution / stack are separate, scannable modules.
 *
 * Labels map onto existing fields — description → Focus, responsibilities →
 * Approach, achievements → Contribution, pipeline → stages. Nothing is added.
 */
export async function Research({ index }: { index: string }) {
  const items = (await getExperiences()).filter(isResearch);
  if (items.length === 0) return null;

  return (
    <Section id="research" spotlight className="border-y border-border bg-surface/40">
      <SectionHeading index={index} eyebrow="Research" title="Research work." />

      <div className="space-y-6">
        {items.map((item) => {
          const { title, topic } = splitRole(item.role);
          const focus = toParagraphs(item.description);
          const document = mediaUrl(item.document);

          return (
            <Card key={item.id} as="article" spotlight reveal className="overflow-hidden">
              <header className="border-b border-border p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="t-label flex items-center gap-2 text-accent">
                    <FlaskIcon width="14" height="14" />
                    {title}
                  </p>
                  <p className="t-label">{formatDateRange(item.startDate, item.endDate, item.isCurrent)}</p>
                </div>
                <h3 className="mt-5 max-w-3xl text-[clamp(1.4rem,1.1rem+1.2vw,2.1rem)] leading-tight tracking-tight">
                  {topic ?? item.role}
                </h3>
                <p className="mt-3 text-sm text-fg-muted">
                  {[item.company, item.location].filter(Boolean).join(' · ')}
                </p>
                {focus.length > 0 ? (
                  <div className="prose-content mt-5 max-w-3xl">
                    {focus.map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                ) : null}
              </header>

              {item.pipeline.length > 0 ? (
                <div className="border-b border-border px-6 py-7 sm:px-8" data-reveal="">
                  <p className="t-label mb-5">Pipeline</p>
                  <ol className="flex flex-col gap-0 md:flex-row md:items-stretch">
                    {item.pipeline.map((stage, i) => (
                      <li
                        key={`${i}-${stage}`}
                        className="flex flex-col md:flex-1 md:flex-row md:items-stretch"
                        style={{ '--step': i } as CSSProperties}
                      >
                        {i > 0 ? (
                          <>
                            <span
                              aria-hidden="true"
                              className="pipeline-connector pipeline-connector-v ml-5 h-5 w-px md:hidden"
                            />
                            <span
                              aria-hidden="true"
                              className="pipeline-connector hidden h-px w-6 shrink-0 self-center md:block lg:w-8"
                            />
                          </>
                        ) : null}
                        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-surface-2 px-3.5 py-3 transition-colors duration-200 hover:border-accent-line">
                          <span className="font-mono text-[0.7rem] text-accent">{pad2(i + 1)}</span>
                          <span className="text-sm leading-snug text-fg">{stage}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-2">
                {item.responsibilities.length > 0 ? (
                  <div className="bg-surface p-6 sm:p-8">
                    <p className="t-label mb-4">Approach</p>
                    <ol className="space-y-4">
                      {item.responsibilities.map((entry, i) => (
                        <li key={i} className="flex gap-4">
                          <span className="mt-0.5 font-mono text-xs text-fg-subtle">{pad2(i + 1)}</span>
                          <span className="text-[0.925rem] leading-relaxed text-fg-muted">{entry}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                <div className="flex flex-col gap-8 bg-surface p-6 sm:p-8">
                  {item.achievements.length > 0 ? (
                    <div>
                      <p className="t-label mb-4">Key contribution</p>
                      <ul className="space-y-3">
                        {item.achievements.map((entry, i) => (
                          <li
                            key={i}
                            className="border-l-2 border-accent pl-4 text-[0.95rem] leading-relaxed text-fg"
                          >
                            {entry}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {item.technologies.length > 0 ? (
                    <div>
                      <p className="t-label mb-3">Stack</p>
                      <div className="flex flex-wrap gap-2">
                        {item.technologies.map((tech) => (
                          <TechChip key={tech}>{tech}</TechChip>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {document ? (
                    <a
                      href={document}
                      {...outboundLinkProps(document)}
                      className="group mt-auto inline-flex items-center gap-1 self-start text-sm text-accent"
                    >
                      <span className="link-underline">View document</span>
                      <ArrowUpRightIcon width="14" height="14" className="arrow-nudge arrow-nudge-diag" />
                    </a>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
