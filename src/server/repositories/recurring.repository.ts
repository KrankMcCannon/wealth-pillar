import { recurringReadColumns, relationalReadsEnabled } from './relational-projections';
import { resolveDb, type DbExecutor } from './db-executor';
import { recurringTransactions, accounts, transactions } from '@/server/db/schema';
import { eq, arrayOverlaps, arrayContains, and, sql, exists } from 'drizzle-orm';

export interface RecurringScope {
  groupId: string;
  userId?: string;
}

function seriesConditions(id: string, scope?: RecurringScope, executor?: DbExecutor) {
  return and(
    eq(recurringTransactions.id, id),
    scope
      ? exists(
          resolveDb(executor)
            .select({ id: accounts.id })
            .from(accounts)
            .where(
              and(
                eq(accounts.id, recurringTransactions.account_id),
                eq(accounts.group_id, scope.groupId)
              )
            )
        )
      : undefined,
    scope?.userId ? arrayContains(recurringTransactions.user_ids, [scope.userId]) : undefined
  );
}

// Aggregate occurrences once for the selected query rather than a correlated
// aggregate for every recurring row. The planner may push the series filter down.
function occurrenceDates(executor?: DbExecutor) {
  return resolveDb(executor)
    .$with('recorded_occurrences')
    .as(
      resolveDb(executor)
        .select({
          series: transactions.recurring_series_id,
          dates: sql<string[]>`array_agg(distinct ${transactions.date}::text)`.as('dates'),
        })
        .from(transactions)
        .groupBy(transactions.recurring_series_id)
    );
}
const recordedDates = sql<string[]>`coalesce(recorded_occurrences.dates, ARRAY[]::text[])`;

export class RecurringRepository {
  static async findById(id: string, scope?: RecurringScope, executor?: DbExecutor) {
    const recorded = occurrenceDates(executor);
    const results = await resolveDb(executor)
      .with(recorded)
      .select({
        recurring: recurringReadColumns(),
        account: accounts,
        recorded_dates: recordedDates,
      })
      .from(recurringTransactions)
      .leftJoin(recorded, eq(recorded.series, recurringTransactions.id))
      .leftJoin(accounts, eq(recurringTransactions.account_id, accounts.id))
      .where(seriesConditions(id, scope, executor));

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
    const recorded = occurrenceDates();
    return await resolveDb()
      .with(recorded)
      .select({ ...recurringReadColumns(), recorded_dates: recordedDates })
      .from(recurringTransactions)
      .leftJoin(recorded, eq(recorded.series, recurringTransactions.id))
      .where(
        relationalReadsEnabled()
          ? sql`exists(select 1 from recurring_users x where x.recurring_id=recurring_transactions.id and x.user_id=${userId}::uuid)`
          : arrayContains(recurringTransactions.user_ids, [userId])
      );
  }

  static async findByUserIds(userIds: string[], groupId?: string) {
    const recorded = occurrenceDates();
    return await resolveDb()
      .with(recorded)
      .select({ ...recurringReadColumns(), recorded_dates: recordedDates })
      .from(recurringTransactions)
      .leftJoin(recorded, eq(recorded.series, recurringTransactions.id))
      .where(
        and(
          relationalReadsEnabled()
            ? sql`exists(select 1 from recurring_users x where x.recurring_id=recurring_transactions.id and x.user_id=any(${sql.param(userIds, accounts.user_ids)}::uuid[]))`
            : arrayOverlaps(recurringTransactions.user_ids, userIds),
          groupId
            ? sql`${recurringTransactions.account_id} in
        (select ${accounts.id} from ${accounts} where ${accounts.group_id} = ${groupId})`
            : undefined
        )
      );
  }

  static async create(data: typeof recurringTransactions.$inferInsert, executor: DbExecutor) {
    const results = await executor.insert(recurringTransactions).values(data).returning();
    return results.length > 0 ? results[0] : null;
  }

  static async update(
    id: string,
    data: Partial<typeof recurringTransactions.$inferInsert>,
    executor: DbExecutor,
    scope?: RecurringScope
  ) {
    const results = await executor
      .update(recurringTransactions)
      .set({ ...data, updated_at: new Date() })
      .where(seriesConditions(id, scope, executor))
      .returning();
    return results.length > 0 ? results[0] : null;
  }

  static async delete(id: string, executor: DbExecutor, scope?: RecurringScope) {
    const results = await executor
      .delete(recurringTransactions)
      .where(seriesConditions(id, scope, executor))
      .returning();
    return results.length > 0 ? results[0] : null;
  }

  static async findActiveByAccount(accountId: string) {
    const recorded = occurrenceDates();
    return await resolveDb()
      .with(recorded)
      .select({ ...recurringReadColumns(), recorded_dates: recordedDates })
      .from(recurringTransactions)
      .leftJoin(recorded, eq(recorded.series, recurringTransactions.id))
      .where(
        and(
          eq(recurringTransactions.account_id, accountId),
          eq(recurringTransactions.is_active, true)
        )
      );
  }
}
