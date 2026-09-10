import 'server-only';

import { asc, eq, inArray, sql } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';

import { getDb } from '@/lib/db';
import { revalidateEntity, type RevalidatePath, type Tag } from '@/lib/cache';

/**
 * Generic CRUD for the ordered content tables (skills, projects, experiences,
 * education, certifications, achievements, social links).
 *
 * They differ only in columns and cache tags, so one factory removes ~10x
 * duplication while every call site stays fully typed against its own row and
 * insert types. Reads used by the public site live in `content.ts` instead,
 * because those need entity-specific filtering, joins and ordering.
 */

export type OrderedTable = PgTable & {
  id: AnyPgColumn;
  displayOrder: AnyPgColumn;
};

export interface CrudOptions {
  /** Cache tags to invalidate after any successful write. */
  tags: Tag[];
  /** Extra paths to revalidate (the homepage is always revalidated). */
  paths?: RevalidatePath[];
  /** Table has an `updated_at` column that should be bumped on update. */
  touchUpdatedAt?: boolean;
}

/**
 * Drizzle's query-builder types cannot be resolved through a bare generic table
 * parameter, so the table is widened for the internal builder calls only. The
 * TRow / TInsert generics keep every public method precisely typed.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function createCrudService<TRow extends { id: number }, TInsert>(
  table: OrderedTable,
  options: CrudOptions,
) {
  const t = table as any;
  const revalidate = () => revalidateEntity(options.tags, options.paths);

  return {
    /** Admin listing: everything, including unpublished rows. */
    async list(): Promise<TRow[]> {
      const db = await getDb();
      return (await db
        .select()
        .from(t)
        .orderBy(asc(table.displayOrder), asc(table.id))) as TRow[];
    },

    async getById(id: number): Promise<TRow | null> {
      const db = await getDb();
      const rows = (await db.select().from(t).where(eq(table.id, id)).limit(1)) as TRow[];
      return rows[0] ?? null;
    },

    async create(values: TInsert): Promise<TRow> {
      const db = await getDb();
      const rows = (await db.insert(t).values(values as any).returning()) as TRow[];
      const created = rows[0];
      if (!created) throw new Error('Insert returned no row.');
      revalidate();
      return created;
    },

    async update(id: number, values: Partial<TInsert>): Promise<TRow | null> {
      const db = await getDb();
      const payload = options.touchUpdatedAt ? { ...values, updatedAt: new Date() } : values;
      const rows = (await db
        .update(t)
        .set(payload as any)
        .where(eq(table.id, id))
        .returning()) as TRow[];
      const updated = rows[0] ?? null;
      if (updated) revalidate();
      return updated;
    },

    async remove(id: number): Promise<boolean> {
      const db = await getDb();
      const rows = (await db.delete(t).where(eq(table.id, id)).returning()) as TRow[];
      const deleted = rows.length > 0;
      if (deleted) revalidate();
      return deleted;
    },

    /**
     * Persists a new ordering. `ids` is the full list in display order and each
     * row's display_order becomes its index. A single UPDATE ... CASE statement
     * means the ordering can never be left half-applied.
     */
    async reorder(ids: number[]): Promise<void> {
      if (ids.length === 0) return;
      const db = await getDb();
      const cases = sql.join(
        ids.map((id, index) => sql`when ${table.id} = ${id} then ${index}`),
        sql` `,
      );
      await db
        .update(t)
        .set({ displayOrder: sql`case ${cases} else ${table.displayOrder} end` } as any)
        .where(inArray(table.id, ids));
      revalidate();
    },

    async count(): Promise<number> {
      const db = await getDb();
      const rows = await db.select({ value: sql<number>`count(*)::int` }).from(t);
      return rows[0]?.value ?? 0;
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
