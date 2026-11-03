import { db } from '@/server/db/drizzle';
import { categories } from '@/server/db/schema';
import { eq, or, sql } from 'drizzle-orm';
import type { Category } from '@/lib/types';
import { SYSTEM_GROUP_ID } from '@/lib/constants';

export class CategoriesRepository {
  static async findAll(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.label) as unknown as Category[];
  }

  static async findById(id: string): Promise<Category | null> {
    const rows = await db.select().from(categories).where(eq(categories.id, id));
    return (rows[0] as unknown as Category) ?? null;
  }

  static async findByKey(key: string): Promise<Category | null> {
    const rows = await db.select().from(categories).where(eq(categories.key, key));
    return (rows[0] as unknown as Category) ?? null;
  }

  static async findByGroup(groupId: string): Promise<Category[]> {
    return db
      .select()
      .from(categories)
      .where(eq(categories.group_id, groupId))
      .orderBy(categories.created_at) as unknown as Category[];
  }

  /** Returns system categories + group-specific categories */
  static async findAvailable(groupId: string): Promise<Category[]> {
    return db
      .select()
      .from(categories)
      .where(or(eq(categories.group_id, groupId), eq(categories.group_id, SYSTEM_GROUP_ID)))
      .orderBy(categories.label) as unknown as Category[];
  }

  static async create(data: typeof categories.$inferInsert): Promise<Category> {
    const rows = await db.insert(categories).values(data).returning();
    return rows[0] as unknown as Category;
  }

  static async update(
    id: string,
    data: Partial<typeof categories.$inferInsert>
  ): Promise<Category> {
    const rows = await db
      .update(categories)
      .set({ ...data, updated_at: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return rows[0] as unknown as Category;
  }

  static async usedKeys(groupId: string): Promise<string[]> {
    const rows = await db.execute<{ category_key: string }>(
      sql`select category_key from public.category_reference_keys(${groupId}::uuid)`
    );
    return rows.map((row) => row.category_key);
  }

  static async delete(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      const [category] = await tx
        .select()
        .from(categories)
        .where(eq(categories.id, id))
        .for('update');
      if (!category) throw new Error('Category not found');
      const used = await tx.execute(
        sql`select 1 from public.category_reference_keys(NULL) where category_key = ${category.key} limit 1`
      );
      if (used.length) throw new Error('CATEGORY_IN_USE');
      // Reference triggers share this row lock, preventing concurrent orphan creation.
      await tx.delete(categories).where(eq(categories.id, id));
    });
  }
}
