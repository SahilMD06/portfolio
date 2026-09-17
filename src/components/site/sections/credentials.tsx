import type { CSSProperties, ReactNode } from 'react';

import { Section, SectionHeading } from '@/components/ui';
import { ArrowUpRightIcon, FileIcon } from '@/components/ui/icons';
import {
  getAchievements,
  getCertifications,
  getEducation,
} from '@/lib/services/content';
import { mediaUrl } from '@/lib/services/media';
import { gradeStat, pad2 } from '@/lib/portfolio';
import { formatDateRange, formatPartialDate, outboundLinkProps } from '@/lib/utils';

function BlockHeader({ id, title, count }: { id: string; title: string; count: number }) {
  return (
    <div id={id} className="mb-5 flex scroll-mt-24 items-baseline justify-between gap-4 border-b border-border pb-3">
      <h3 className="text-lg tracking-tight">{title}</h3>
      <span className="font-mono text-xs text-fg-subtle tabular-nums">{pad2(count)}</span>
    </div>
  );
}

function CardLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      {...outboundLinkProps(href)}
      className="group inline-flex items-center gap-1 text-[0.825rem] text-fg-muted transition-colors hover:text-accent"
    >
      <span className="link-underline">{children}</span>
      <ArrowUpRightIcon width="13" height="13" className="arrow-nudge arrow-nudge-diag" />
    </a>
  );
}

const stagger = (i: number) => ({ '--i': i }) as CSSProperties;

/**
 * Education, certifications and achievements as one scannable block. Each keeps
 * its own anchor (#education, #certifications, #achievements) so existing links
 * still land in the right place.
 */
export async function Credentials({ index }: { index: string }) {
  const [education, certifications, achievements] = await Promise.all([
    getEducation(),
    getCertifications(),
    getAchievements(),
  ]);

  if (education.length + certifications.length + achievements.length === 0) return null;

  const [primary, ...schools] = education;
  const primaryGrade = gradeStat(primary?.grade);

  return (
    <Section id="credentials" spotlight>
      <SectionHeading index={index} eyebrow="Credentials" title="Education & certifications." />

      <div className="space-y-16">
        {primary ? (
          <div>
            <BlockHeader id="education" title="Education" count={education.length} />
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-3">
              <div
                data-spotlight=""
                data-reveal=""
                className="surface spotlight flex min-w-0 flex-col justify-between gap-8 p-6 sm:p-8 lg:col-span-2"
              >
                <div>
                  <p className="t-label">
                    {formatDateRange(primary.startDate, primary.endDate)}
                  </p>
                  <p className="mt-3 text-xl leading-snug tracking-tight">{primary.institution}</p>
                  <p className="mt-2 text-fg-muted">
                    {primary.degree}
                    {primary.field ? ` · ${primary.field}` : ''}
                  </p>
                  {primary.description ? (
                    <p className="mt-3 text-sm leading-relaxed text-fg-muted">{primary.description}</p>
                  ) : null}
                </div>
                {primaryGrade ? (
                  <div className="flex items-end gap-3 border-t border-border pt-6">
                    <span className="text-5xl leading-none font-semibold tracking-tight tabular-nums">
                      {primaryGrade.value}
                    </span>
                    <span className="t-label pb-1">
                      {primaryGrade.label} {primaryGrade.suffix}
                    </span>
                  </div>
                ) : primary.grade ? (
                  <p className="t-label">{primary.grade}</p>
                ) : null}
              </div>

              {schools.length > 0 ? (
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
                  {schools.map((item, i) => {
                    const grade = gradeStat(item.grade);
                    return (
                      <div
                        key={item.id}
                        data-spotlight=""
                        data-reveal=""
                        style={stagger(i + 1)}
                        className="surface spotlight flex min-w-0 items-center justify-between gap-4 p-5"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">
                            {item.degree}
                            {item.field ? (
                              <span className="font-normal text-fg-muted"> · {item.field}</span>
                            ) : null}
                          </p>
                          <p className="mt-1 truncate text-sm text-fg-muted">{item.institution}</p>
                          <p className="t-label mt-2">
                            {formatDateRange(item.startDate, item.endDate)}
                          </p>
                        </div>
                        {grade ? (
                          <span className="shrink-0 text-2xl font-semibold tracking-tight tabular-nums">
                            {grade.value}
                            <span className="text-sm font-normal text-fg-subtle">{grade.suffix}</span>
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {certifications.length > 0 ? (
          <div>
            <BlockHeader id="certifications" title="Certifications" count={certifications.length} />
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {certifications.map((item, i) => {
                const file = mediaUrl(item.file);
                return (
                  <li
                    key={item.id}
                    data-spotlight=""
                    data-reveal=""
                    style={stagger(i)}
                    className="surface spotlight flex flex-col p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="t-label truncate">{item.issuer}</span>
                      {item.issueDate ? (
                        <span className="t-label shrink-0">{formatPartialDate(item.issueDate)}</span>
                      ) : null}
                    </div>
                    <p className="mt-3 leading-snug font-medium">{item.name}</p>
                    {item.credentialId ? (
                      <p className="mt-2 truncate font-mono text-[0.7rem] text-fg-subtle" title={item.credentialId}>
                        ID {item.credentialId}
                      </p>
                    ) : null}
                    {item.credentialUrl || file ? (
                      <div className="mt-auto flex flex-wrap items-center gap-4 pt-5">
                        {item.credentialUrl ? <CardLink href={item.credentialUrl}>Verify</CardLink> : null}
                        {file ? (
                          <a
                            href={file}
                            {...outboundLinkProps(file)}
                            className="inline-flex items-center gap-1.5 text-[0.825rem] text-fg-muted transition-colors hover:text-fg"
                          >
                            <FileIcon width="13" height="13" />
                            <span className="link-underline">Certificate</span>
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {achievements.length > 0 ? (
          <div>
            <BlockHeader id="achievements" title="Achievements" count={achievements.length} />
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {achievements.map((item, i) => {
                const file = mediaUrl(item.file);
                return (
                  <li
                    key={item.id}
                    data-spotlight=""
                    data-reveal=""
                    style={stagger(i)}
                    className="surface spotlight flex flex-col p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-accent">{pad2(i + 1)}</span>
                      {item.date ? (
                        <span className="t-label">{formatPartialDate(item.date)}</span>
                      ) : null}
                    </div>
                    <p className="mt-4 leading-snug font-medium">{item.title}</p>
                    {item.organization ? (
                      <p className="mt-1.5 text-xs text-fg-subtle">{item.organization}</p>
                    ) : null}
                    {item.description ? (
                      <p className="mt-3 text-sm leading-relaxed text-fg-muted">{item.description}</p>
                    ) : null}
                    {item.url || file ? (
                      <div className="mt-auto flex flex-wrap items-center gap-4 pt-4">
                        {item.url ? <CardLink href={item.url}>Details</CardLink> : null}
                        {file ? <CardLink href={file}>Document</CardLink> : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </Section>
  );
}
