import { Badge, Card, Section, SectionHeading } from '@/components/ui';
import { getEducation } from '@/lib/services/content';
import { formatDateRange } from '@/lib/utils';

export async function EducationSection() {
  const items = await getEducation();
  if (items.length === 0) return null;

  return (
    <Section id="education" className="reveal">
      <SectionHeading eyebrow="Education" title="Academic background" />

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold">{item.institution}</h3>
                <p className="mt-0.5 text-sm text-fg-muted">
                  {item.degree}
                  {item.field ? ` · ${item.field}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {item.grade ? <Badge tone="accent">{item.grade}</Badge> : null}
                <span className="font-mono text-xs text-fg-subtle">
                  {formatDateRange(item.startDate, item.endDate)}
                </span>
              </div>
            </div>

            {item.description ? (
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">{item.description}</p>
            ) : null}

            {item.achievements.length > 0 ? (
              <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
                {item.achievements.map((entry, index) => (
                  <li key={index} className="flex gap-2.5">
                    <span
                      className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-border-strong"
                      aria-hidden="true"
                    />
                    <span>{entry}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        ))}
      </div>
    </Section>
  );
}
