import { accountReadColumns, relationalReadsEnabled } from './relational-projections';
import { readWithRetry } from '@/server/db/read-with-retry';
import { accounts } from '@/server/db/schema';
import { eq, sql, getTableColumns, inArray, asc } from 'drizzle-orm';
import type { Account } from '@/lib/types';
import { resolveDb, type DbExecutor } from './db-executor';

const accountColumns = {
  ...getTableColumns(accounts),
  balance_version: sql<string>`${accounts.balance_version}::text`,
};

export class AccountsRepository {
  static async findAuthorizationRows(ids: string[], executor?: DbExecutor) {
    if (!ids.length) return [];
    const columns = accountReadColumns();
    const query = resolveDb(executor)
      .select({ id: accounts.id, group_id: accounts.group_id, user_ids: columns.user_ids })
      .from(accounts)
      .where(inArray(accounts.id, [...new Set(ids)]))
      .orderBy(asc(accounts.id));
    return executor ? query.for('no key update') : query;
  }
  static async findByIdForUpdate(id: string, executor: DbExecutor): Promise<Account | null> {
    const [row] = await executor
      .select(accountReadColumns())
      .from(accounts)
      .where(eq(accounts.id, id))
      .for('update');
    return (row as unknown as Account) ?? null;
  }

  static async findById(id: string, executor?: DbExecutor): Promise<Account | null> {
    const rows = await resolveDb(executor)
      .select(accountReadColumns())
      .from(accounts)
      .where(eq(accounts.id, id));
    return (rows[0] as unknown as Account) ?? null;
  }

  static async findByGroup(groupId: string, executor?: DbExecutor): Promise<Account[]> {
    const read = () =>
      resolveDb(executor)
        .select(accountReadColumns())
        .from(accounts)
        .where(eq(accounts.group_id, groupId))
        .orderBy(accounts.created_at);
    return (executor ? await read() : await readWithRetry(read)) as unknown as Account[];
  }

  static async findByUser(userId: string): Promise<Account[]> {
    // user_ids is a uuid[] column – use @> (contains) operator
    return resolveDb()
      .select(accountReadColumns())
      .from(accounts)
      .where(
        relationalReadsEnabled()
          ? sql`exists(select 1 from account_users x where x.account_id=accounts.id and x.user_id=${userId}::uuid)`
          : sql`${accounts.user_ids} @> ARRAY[${userId}]::uuid[]`
      )
      .orderBy(accounts.created_at) as unknown as Account[];
  }

  static async countByUser(userId: string): Promise<number> {
    const result = await resolveDb()
      .select({ count: sql<number>`count(*)` })
      .from(accounts)
      .where(
        relationalReadsEnabled()
          ? sql`exists(select 1 from account_users x where x.account_id=accounts.id and x.user_id=${userId}::uuid)`
          : sql`${accounts.user_ids} @> ARRAY[${userId}]::uuid[]`
      );
    return Number(result[0]?.count ?? 0);
  }

  static async create(data: typeof accounts.$inferInsert): Promise<Account> {
    const rows = await resolveDb().insert(accounts).values(data).returning(accountColumns);
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

  static async delete(id: string, executor: DbExecutor): Promise<Account> {
    const rows = await executor
      .delete(accounts)
      .where(eq(accounts.id, id))
      .returning(accountColumns);
    return rows[0] as unknown as Account;
  }
}
