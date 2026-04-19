import { db } from '@/server/db/drizzle';
import { accounts } from '@/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { Account } from '@/lib/types';

export class AccountsRepository {
  static async findById(id: string): Promise<Account | null> {
    const rows = await db.select().from(accounts).where(eq(accounts.id, id));
    return (rows[0] as unknown as Account) ?? null;
  }

  static async findByGroup(groupId: string): Promise<Account[]> {
    return db
      .select()
      .from(accounts)
      .where(eq(accounts.group_id, groupId))
      .orderBy(accounts.created_at) as unknown as Account[];
  }

  static async findByUser(userId: string): Promise<Account[]> {
    // user_ids is a uuid[] column – use @> (contains) operator
    return db
      .select()
      .from(accounts)
      .where(sql`${accounts.user_ids} @> ARRAY[${userId}]::uuid[]`)
      .orderBy(accounts.created_at) as unknown as Account[];
  }

  static async countByUser(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(accounts)
      .where(sql`${accounts.user_ids} @> ARRAY[${userId}]::uuid[]`);
    return Number(result[0]?.count ?? 0);
  }

  static async create(data: typeof accounts.$inferInsert): Promise<Account> {
    const rows = await db.insert(accounts).values(data).returning();
    return rows[0] as unknown as Account;
  }

  static async update(id: string, data: Partial<typeof accounts.$inferInsert>): Promise<Account> {
    const rows = await db
      .update(accounts)
      .set({ ...data, updated_at: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return rows[0] as unknown as Account;
  }

  static async delete(id: string): Promise<Account> {
    const rows = await db.delete(accounts).where(eq(accounts.id, id)).returning();
    return rows[0] as unknown as Account;
  }
}
