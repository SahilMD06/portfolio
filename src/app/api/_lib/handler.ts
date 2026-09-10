import 'server-only';

import { NextResponse } from 'next/server';
import type { z } from 'zod';

import { CsrfError, assertSameOrigin } from '@/lib/auth/origin';
import { UnauthorizedError, requireAdmin } from '@/lib/auth/session';
import { UploadError } from '@/lib/storage/policy';

/**
 * Shared plumbing for the REST API.
 *
 * Public reads and admin mutations are separate route trees; only the admin
 * ones call `withAdmin`, and that check happens inside the handler rather than
 * in middleware, so it cannot be skipped by a routing change.
 */

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Maps known error types to a safe status + message; everything else is a 500. */
function toResponse(err: unknown) {
  if (err instanceof UnauthorizedError) return error('Unauthorized', 401);
  if (err instanceof CsrfError) return error('Cross-origin request rejected', 403);
  if (err instanceof UploadError) return error(err.message, 400);
  if ((err as { code?: string })?.code === '23505') {
    return error('That value must be unique (a record already uses it).', 409);
  }
  // Never leak internals to the client.
  console.error('API error:', err);
  return error('Internal server error', 500);
}

/** Wraps a public read handler with uniform error handling. */
export function withPublic(handler: () => Promise<Response>) {
  return async () => {
    try {
      return await handler();
    } catch (err) {
      return toResponse(err);
    }
  };
}

/**
 * Wraps an admin handler: verifies the session server-side, checks the Origin
 * header for state-changing verbs, then runs the handler.
 */
export async function withAdmin(
  request: Request,
  handler: () => Promise<Response>,
): Promise<Response> {
  try {
    const method = request.method.toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      await assertSameOrigin();
    }
    await requireAdmin();
    return await handler();
  } catch (err) {
    return toResponse(err);
  }
}

/** Parses a JSON body against a schema, returning 400 details on failure. */
export async function parseBody<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<{ ok: true; data: z.infer<TSchema> } | { ok: false; response: Response }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: error('Request body must be valid JSON.', 400) };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      response: error('Validation failed', 400, { fieldErrors }),
    };
  }
  return { ok: true, data: parsed.data };
}

/** Validates a numeric route id. */
export function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
