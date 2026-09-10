import { Card, Section, SectionHeading } from '@/components/ui';
import { getProfile } from '@/lib/services/content';
import { toParagraphs } from '@/lib/utils';

export async function About() {
  const profile = await getProfile();
  const paragraphs = toParagraphs(profile.about);

  const facts = [
    { label: 'Current focus', value: profile.currentFocus },
    { label: 'Career interests', value: profile.careerInterests },
    { label: 'Technical interests', value: profile.technicalInterests },
  ].filter((fact) => fact.value.trim().length > 0);

  if (paragraphs.length === 0 && facts.length === 0) return null;

  return (
    <Section id="about" className="reveal">
      <SectionHeading eyebrow="About" title="A little more context" />

      <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {paragraphs.length > 0 ? (
          <div className="prose-content max-w-prose">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        ) : null}

        {facts.length > 0 ? (
          <Card className="h-fit p-5">
            <dl className="space-y-4">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-xs font-semibold tracking-[0.1em] text-fg-subtle uppercase">
                    {fact.label}
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ) : null}
      </div>
    </Section>
  );
}
