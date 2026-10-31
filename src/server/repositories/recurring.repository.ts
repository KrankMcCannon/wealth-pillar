import { db } from '@/server/db/drizzle';
import { recurringTransactions, accounts } from '@/server/db/schema';
import { eq, arrayOverlaps, arrayContains, and, sql, getTableColumns } from 'drizzle-orm';

// The series remains a plan; only actual ledger rows mark an occurrence as recorded.
// Keep these qualified identifiers literal: Drizzle removes Column qualifiers in a
// single-table projection, which would bind the correlated id to the inner ledger.
const recordedDates = sql<string[]>`coalesce((
  select array_agg(distinct recorded_ledger.date::text)
  from transactions as recorded_ledger
  where recorded_ledger.recurring_series_id = recurring_transactions.id
), ARRAY[]::text[])`;

export class RecurringRepository {
  static async findById(id: string) {
    const results = await db
      .select({
        recurring: recurringTransactions,
        account: accounts,
        recorded_dates: recordedDates,
      })
      .from(recurringTransactions)
      .leftJoin(accounts, eq(recurringTransactions.account_id, accounts.id))
      .where(eq(recurringTransactions.id, id));

    if (results.length === 0) return null;

    const firstResult = results[0];

    // Combine the result as the service did
    return {
      ...firstResult?.recurring,
      accounts: firstResult?.account,
      recorded_dates: firstResult?.recorded_dates,
    };
  }

  static async findByUser(userId: string) {
    return await db
      .select({ ...getTableColumns(recurringTransactions), recorded_dates: recordedDates })
      .from(recurringTransactions)
      .where(arrayContains(recurringTransactions.user_ids, [userId]));
  }

  static async findByUserIds(userIds: string[]) {
    return await db
      .select({ ...getTableColumns(recurringTransactions), recorded_dates: recordedDates })
      .from(recurringTransactions)
      .where(arrayOverlaps(recurringTransactions.user_ids, userIds));
  }

  static async create(data: typeof recurringTransactions.$inferInsert) {
    const results = await db.insert(recurringTransactions).values(data).returning();
    return results.length > 0 ? results[0] : null;
  }

  static async update(id: string, data: Partial<typeof recurringTransactions.$inferInsert>) {
    const results = await db
      .update(recurringTransactions)
      .set({ ...data, updated_at: new Date() })
      .where(eq(recurringTransactions.id, id))
      .returning();
    return results.length > 0 ? results[0] : null;
  }

  static async delete(id: string) {
    const results = await db
      .delete(recurringTransactions)
      .where(eq(recurringTransactions.id, id))
      .returning();
    return results.length > 0 ? results[0] : null;
  }

  static async findActiveByAccount(accountId: string) {
    return await db
      .select({ ...getTableColumns(recurringTransactions), recorded_dates: recordedDates })
      .from(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.account_id, accountId),
          eq(recurringTransactions.is_active, true)
        )
      );
  }
}
