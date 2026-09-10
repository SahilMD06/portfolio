import { Card, Section, SectionHeading } from '@/components/ui';
import { ExternalIcon, FileIcon } from '@/components/ui/icons';
import { getAchievements, getCertifications } from '@/lib/services/content';
import { mediaUrl } from '@/lib/services/media';
import { formatPartialDate } from '@/lib/utils';

export async function Certifications() {
  const items = await getCertifications();
  if (items.length === 0) return null;

  return (
    <Section id="certifications" className="reveal">
      <SectionHeading eyebrow="Certifications" title="Credentials" />

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => {
          const file = mediaUrl(item.file);
          return (
            <Card key={item.id} className="flex flex-col p-5">
              <h3 className="text-sm font-semibold">{item.name}</h3>
              <p className="mt-1 text-sm text-fg-muted">{item.issuer}</p>

              <dl className="mt-3 space-y-1 text-xs text-fg-subtle">
                {item.issueDate ? (
                  <div className="flex gap-2">
                    <dt>Issued</dt>
                    <dd className="font-mono">{formatPartialDate(item.issueDate)}</dd>
                  </div>
                ) : null}
                {item.credentialId ? (
                  <div className="flex gap-2">
                    <dt>Credential ID</dt>
                    <dd className="font-mono break-all">{item.credentialId}</dd>
                  </div>
                ) : null}
              </dl>

              {item.credentialUrl || file ? (
                <div className="mt-4 flex flex-wrap items-center gap-4 pt-1">
                  {item.credentialUrl ? (
                    <a
                      href={item.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                    >
                      <ExternalIcon width="14" height="14" />
                      Verify
                    </a>
                  ) : null}
                  {file ? (
                    <a
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg"
                    >
                      <FileIcon width="14" height="14" />
                      Certificate
                    </a>
                  ) : null}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

export async function Achievements() {
  const items = await getAchievements();
  if (items.length === 0) return null;

  return (
    <Section id="achievements" className="reveal">
      <SectionHeading eyebrow="Achievements" title="Recognition" />

      <div className="space-y-4">
        {items.map((item) => {
          const file = mediaUrl(item.file);
          return (
            <Card key={item.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  {item.organization ? (
                    <p className="mt-0.5 text-sm text-fg-muted">{item.organization}</p>
                  ) : null}
                </div>
                {item.date ? (
                  <span className="font-mono text-xs text-fg-subtle">
                    {formatPartialDate(item.date)}
                  </span>
                ) : null}
              </div>

              {item.description ? (
                <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">{item.description}</p>
              ) : null}

              {item.url || file ? (
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                    >
                      <ExternalIcon width="14" height="14" />
                      Details
                    </a>
                  ) : null}
                  {file ? (
                    <a
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg"
                    >
                      <FileIcon width="14" height="14" />
                      Document
                    </a>
                  ) : null}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
