import { Section, SectionHeading } from '@/components/ui';
import { getAchievements, getEducation, getProfile } from '@/lib/services/content';
import { gradeStat, pad2, splitDotList } from '@/lib/portfolio';
import { formatDateRange, toParagraphs } from '@/lib/utils';

/** A metadata block in the right-hand margin: label, rule, content. */
function MarginBlock({
  label,
  children,
  index,
}: {
  label: string;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <div data-reveal="right" style={{ '--i': index } as React.CSSProperties}>
      <div className="hairline mb-5" aria-hidden="true" />
      <p className="t-label mb-4">{label}</p>
      {children}
    </div>
  );
}

/**
 * About as an editorial spread: the statement runs in a wide measure on the
 * left, with education, focus and interests set as margin notes beside it.
 * No cards — the rhythm comes from rules and whitespace.
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
      <SectionHeading
        index={index}
        eyebrow="About"
        title={
          <>
            Who I am, and <span className="t-em">what I work on</span>.
          </>
        }
      />

      <div className="grid grid-cols-1 gap-x-16 gap-y-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {paragraphs.length > 0 ? (
            <div data-reveal="" className="max-w-[60ch]">
              {paragraphs.map((paragraph, i) => (
                <p
                  key={i}
                  className={
                    i === 0
                      ? 'text-[clamp(1.1rem,1rem+0.4vw,1.3rem)] leading-[1.6] font-light text-fg'
                      : 'mt-5 leading-[1.75] text-fg-muted'
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}

          {highlights.length > 0 ? (
            <div className="mt-14" data-reveal="">
              <p className="t-label mb-6">Selected highlights</p>
              <ol className="divide-y divide-border border-y border-border">
                {highlights.map((item, i) => (
                  <li key={item.id} className="group flex gap-6 py-5">
                    <span className="mt-1 font-mono text-[0.7rem] text-accent tabular-nums">
                      {pad2(i + 1)}
                    </span>
                    <span className="text-[0.95rem] leading-relaxed font-light text-fg-muted transition-colors duration-300 group-hover:text-fg">
                      {item.title}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-12 lg:col-span-4 lg:col-start-9">
          {primaryEducation ? (
            <MarginBlock label="Education" index={0}>
              <p className="text-[0.98rem] leading-snug font-light text-fg">
                {primaryEducation.institution}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                {primaryEducation.degree}
                {primaryEducation.field ? ` · ${primaryEducation.field}` : ''}
              </p>
              <p className="t-label mt-4">
                {formatDateRange(primaryEducation.startDate, primaryEducation.endDate)}
              </p>
              {grade ? (
                <p className="mt-6 flex items-baseline gap-2">
                  <span className="text-[2.6rem] leading-none font-light tracking-[-0.03em] tabular-nums">
                    <span data-count={grade.value}>{grade.value}</span>
                  </span>
                  <span className="t-label">
                    {grade.label} {grade.suffix}
                  </span>
                </p>
              ) : null}
            </MarginBlock>
          ) : null}

          {profile.currentFocus ? (
            <MarginBlock label="Current focus" index={1}>
              <p className="text-sm leading-[1.7] text-fg-muted">{profile.currentFocus}</p>
            </MarginBlock>
          ) : null}

          {careerInterests.length > 0 || profile.technicalInterests ? (
            <MarginBlock label="Interests" index={2}>
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
                <p className="mt-4 text-sm leading-[1.7] text-fg-muted">
                  {profile.technicalInterests}
                </p>
              ) : null}
            </MarginBlock>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
