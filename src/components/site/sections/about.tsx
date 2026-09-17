import type { ReactNode } from 'react';

import { Card, Section, SectionHeading } from '@/components/ui';
import { AwardIcon, CompassIcon, GraduationIcon, TargetIcon } from '@/components/ui/icons';
import { getAchievements, getEducation, getProfile } from '@/lib/services/content';
import { gradeStat, pad2, splitDotList } from '@/lib/portfolio';
import { formatDateRange, toParagraphs } from '@/lib/utils';

function ModuleHeader({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-surface-2 text-accent transition-transform duration-300 group-hover:-translate-y-0.5">
        {icon}
      </span>
      <span className="t-label">{label}</span>
    </div>
  );
}

/**
 * About, as modular blocks rather than one long paragraph: a summary, the
 * headline education result, current focus, interests and top highlights.
 */
export async function About({ index }: { index: string }) {
  const [profile, education, achievements] = await Promise.all([
    getProfile(),
    getEducation(),
    getAchievements(),
  ]);

  const paragraphs = toParagraphs(profile.about);
  const primaryEducation = education[0];
  const grade = gradeStat(primaryEducation?.grade);
  const careerInterests = splitDotList(profile.careerInterests);
  const highlights = achievements.slice(0, 3);

  if (paragraphs.length === 0 && !profile.currentFocus && !primaryEducation) return null;

  return (
    <Section id="about" spotlight>
      <SectionHeading index={index} eyebrow="About" title="Who I am and what I work on." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {paragraphs.length > 0 ? (
          <Card spotlight reveal index={0} className="group p-6 sm:p-8 lg:col-span-7 lg:row-span-2">
            <ModuleHeader icon={<CompassIcon width="14" height="14" />} label="Summary" />
            <div className="prose-content text-[1.02rem]">
              {paragraphs.map((paragraph, i) => (
                <p key={i} className={i === 0 ? 'text-fg' : undefined}>
                  {paragraph}
                </p>
              ))}
            </div>
          </Card>
        ) : null}

        {primaryEducation ? (
          <Card spotlight reveal index={1} className="group p-6 sm:p-7 lg:col-span-5">
            <ModuleHeader icon={<GraduationIcon width="14" height="14" />} label="Education" />
            <div className="flex items-end justify-between gap-6">
              <div className="min-w-0">
                <p className="font-medium text-fg">{primaryEducation.institution}</p>
                <p className="mt-1 text-sm text-fg-muted">
                  {primaryEducation.degree}
                  {primaryEducation.field ? ` · ${primaryEducation.field}` : ''}
                </p>
                <p className="t-label mt-3">
                  {formatDateRange(primaryEducation.startDate, primaryEducation.endDate)}
                </p>
              </div>
              {grade ? (
                <div className="shrink-0 text-right">
                  <p className="text-4xl leading-none font-semibold tracking-tight tabular-nums">
                    {grade.value}
                  </p>
                  <p className="t-label mt-2">
                    {grade.label} {grade.suffix}
                  </p>
                </div>
              ) : null}
            </div>
          </Card>
        ) : null}

        {profile.currentFocus ? (
          <Card spotlight reveal index={2} className="group p-6 sm:p-7 lg:col-span-5">
            <ModuleHeader icon={<TargetIcon width="14" height="14" />} label="Current focus" />
            <p className="leading-relaxed text-fg-muted">{profile.currentFocus}</p>
          </Card>
        ) : null}

        {careerInterests.length > 0 || profile.technicalInterests ? (
          <Card spotlight reveal index={3} className="group p-6 sm:p-7 lg:col-span-6">
            <ModuleHeader icon={<CompassIcon width="14" height="14" />} label="Interests" />
            {careerInterests.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {careerInterests.map((interest) => (
                  <li key={interest} className="chip">
                    {interest}
                  </li>
                ))}
              </ul>
            ) : null}
            {profile.technicalInterests ? (
              <p className="mt-4 text-sm leading-relaxed text-fg-muted">
                {profile.technicalInterests}
              </p>
            ) : null}
          </Card>
        ) : null}

        {highlights.length > 0 ? (
          <Card spotlight reveal index={4} className="group p-6 sm:p-7 lg:col-span-6">
            <ModuleHeader icon={<AwardIcon width="14" height="14" />} label="Highlights" />
            <ol className="space-y-3">
              {highlights.map((item, i) => (
                <li key={item.id} className="flex gap-3">
                  <span className="mt-0.5 font-mono text-xs text-accent">{pad2(i + 1)}</span>
                  <span className="text-sm leading-relaxed text-fg">{item.title}</span>
                </li>
              ))}
            </ol>
          </Card>
        ) : null}
      </div>
    </Section>
  );
}
