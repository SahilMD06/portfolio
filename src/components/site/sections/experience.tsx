import Image from 'next/image';

import { Badge, Section, SectionHeading, TechChip } from '@/components/ui';
import { FileIcon } from '@/components/ui/icons';
import { getExperiences } from '@/lib/services/content';
import { mediaUrl } from '@/lib/services/media';
import { formatDateRange, toParagraphs } from '@/lib/utils';

export async function Experience() {
  const experiences = await getExperiences();
  if (experiences.length === 0) return null;

  return (
    <Section id="experience" className="reveal">
      <SectionHeading eyebrow="Experience" title="Where I've worked" />

      {/* Timeline: a single ruled line with a marker per role. */}
      <ol className="relative space-y-8 border-l border-border pl-6 sm:pl-8">
        {experiences.map((item) => {
          const logo = mediaUrl(item.logo);
          const document = mediaUrl(item.document);
          const paragraphs = toParagraphs(item.description);

          return (
            <li key={item.id} className="relative">
              <span
                className="absolute top-1.5 -left-[1.6rem] h-2.5 w-2.5 rounded-full border-2 border-bg bg-accent sm:-left-[2.1rem]"
                aria-hidden="true"
              />

              <div className="flex flex-wrap items-start gap-3">
                {logo ? (
                  <Image
                    src={logo}
                    alt={`${item.company} logo`}
                    width={36}
                    height={36}
                    className="mt-0.5 h-9 w-9 rounded-md border border-border object-contain"
                  />
                ) : null}

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold">{item.role}</h3>
                  <p className="mt-0.5 text-sm text-fg-muted">
                    {item.company}
                    {item.location ? ` · ${item.location}` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {item.isCurrent ? <Badge tone="success">Current</Badge> : null}
                  <Badge>{item.employmentType}</Badge>
                </div>
              </div>

              <p className="mt-2 font-mono text-xs text-fg-subtle">
                {formatDateRange(item.startDate, item.endDate, item.isCurrent)}
              </p>

              {paragraphs.length > 0 ? (
                <div className="prose-content mt-3 text-sm">
                  {paragraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              ) : null}

              {item.responsibilities.length > 0 ? (
                <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
                  {item.responsibilities.map((entry, index) => (
                    <li key={index} className="flex gap-2.5">
                      <span className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-border-strong" aria-hidden="true" />
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {item.achievements.length > 0 ? (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {item.achievements.map((entry, index) => (
                    <li key={index} className="flex gap-2.5 text-fg">
                      <span className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {item.technologies.length > 0 ? (
                <ul className="mt-3.5 flex flex-wrap gap-1.5">
                  {item.technologies.map((tech) => (
                    <li key={tech}>
                      <TechChip>{tech}</TechChip>
                    </li>
                  ))}
                </ul>
              ) : null}

              {document ? (
                <a
                  href={document}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                >
                  <FileIcon width="14" height="14" />
                  View certificate
                </a>
              ) : null}
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
