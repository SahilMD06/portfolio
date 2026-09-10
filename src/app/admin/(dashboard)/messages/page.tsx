import { desc } from 'drizzle-orm';

import { Badge, Card, EmptyState } from '@/components/ui';
import { requireAdminPage } from '@/lib/auth/guard';
import { getDb } from '@/lib/db';
import { contactMessages } from '@/lib/db/schema';
import { formatDateTime } from '@/lib/utils';

export const metadata = { title: 'Messages' };

export default async function AdminMessagesPage() {
  await requireAdminPage();

  const db = await getDb();
  const messages = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(100);

  return (
    <>
      <header className="mb-6">
        <h1 className="text-xl font-semibold">Messages</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Submissions from the contact form on your portfolio.
        </p>
      </header>

      {messages.length === 0 ? (
        <EmptyState
          title="No messages yet"
          description="Messages sent through the contact form will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {messages.map((message) => (
            <Card key={message.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{message.name}</p>
                  <a
                    href={`mailto:${message.email}`}
                    className="text-xs text-accent hover:underline"
                  >
                    {message.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  {message.read ? null : <Badge tone="accent">New</Badge>}
                  <span className="font-mono text-xs text-fg-subtle">
                    {formatDateTime(message.createdAt)}
                  </span>
                </div>
              </div>
              {/* Rendered as a text node — submitted content can never inject markup. */}
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-fg-muted">
                {message.message}
              </p>
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
