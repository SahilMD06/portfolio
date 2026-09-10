'use server';

import { headers } from 'next/headers';

import { getDb } from '@/lib/db';
import { contactMessages } from '@/lib/db/schema';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { contactMessageSchema } from '@/lib/validation/schemas';

export interface ContactFormState {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Public endpoint, so it is defensive: honeypot field, per-IP rate limit, and
 * strict validation before anything reaches the database. Messages are stored
 * rather than emailed, so there is no SMTP dependency to configure.
 */
export async function submitContactMessage(
  _previous: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const parsed = contactMessageSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
    website: formData.get('website'),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    // The honeypot is invisible, so a human can never trigger it. Report a
    // generic failure rather than revealing the anti-spam mechanism.
    if (fieldErrors.website) {
      return { status: 'error', message: 'Your message could not be sent.' };
    }
    return { status: 'error', message: 'Please check the highlighted fields.', fieldErrors };
  }

  const headerList = await headers();
  const limit = rateLimit(clientKey(headerList, 'contact'), 5, 10 * 60 * 1000);
  if (!limit.allowed) {
    return {
      status: 'error',
      message: `Too many messages sent. Please try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
    };
  }

  try {
    const db = await getDb();
    await db.insert(contactMessages).values({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
    });
  } catch (error) {
    // Log server-side; never surface internals to the visitor.
    console.error('Failed to store contact message:', error);
    return { status: 'error', message: 'Something went wrong. Please email me directly instead.' };
  }

  return { status: 'success', message: 'Thanks — your message has been sent. I will reply soon.' };
}
