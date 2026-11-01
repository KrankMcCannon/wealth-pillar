import { db } from '@/server/db/drizzle';
import { accounts } from '@/server/db/schema';
import { eq, sql, getTableColumns } from 'drizzle-orm';
import type { Account } from '@/lib/types';
import { resolveDb, type DbExecutor } from './db-executor';

const accountColumns = {
  ...getTableColumns(accounts),
  balance_version: sql<string>`${accounts.balance_version}::text`,
};

export class AccountsRepository {
  static async findByIdForUpdate(id: string, executor: DbExecutor): Promise<Account | null> {
    const [row] = await executor
      .select(accountColumns)
      .from(accounts)
      .where(eq(accounts.id, id))
      .for('update');
    return (row as unknown as Account) ?? null;
  }

  static async findById(id: string, executor?: DbExecutor): Promise<Account | null> {
    const rows = await resolveDb(executor)
      .select(accountColumns)
      .from(accounts)
      .where(eq(accounts.id, id));
    return (rows[0] as unknown as Account) ?? null;
  }

  static async findByGroup(groupId: string, executor?: DbExecutor): Promise<Account[]> {
    return resolveDb(executor)
      .select(accountColumns)
      .from(accounts)
      .where(eq(accounts.group_id, groupId))
      .orderBy(accounts.created_at) as unknown as Account[];
  }

  static async findByUser(userId: string): Promise<Account[]> {
    // user_ids is a uuid[] column – use @> (contains) operator
    return db
      .select(accountColumns)
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
    const rows = await db.insert(accounts).values(data).returning(accountColumns);
    return rows[0] as unknown as Account;
  }

  static async update(
    id: string,
    data: Partial<typeof accounts.$inferInsert>,
    executor?: DbExecutor
  ): Promise<Account> {
    const rows = await resolveDb(executor)
      .update(accounts)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(accounts.id, id))
      .returning(accountColumns);
    return rows[0] as unknown as Account;
  }

  static async delete(id: string, executor?: DbExecutor): Promise<Account> {
    const rows = await resolveDb(executor)
      .delete(accounts)
      .where(eq(accounts.id, id))
      .returning(accountColumns);
    return rows[0] as unknown as Account;
  }
}
