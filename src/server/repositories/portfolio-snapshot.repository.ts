import { resolveDb, type DbExecutor } from './db-executor';
import { db } from '@/server/db/drizzle';
import { portfolioValueSnapshots } from '@/server/db/schema';
import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';

export class PortfolioSnapshotRepository {
  static async deleteFrom(userId: string, date: string, executor: DbExecutor) {
    await resolveDb(executor)
      .delete(portfolioValueSnapshots)
      .where(
        and(
          eq(portfolioValueSnapshots.user_id, userId),
          gte(portfolioValueSnapshots.snapshot_date, date)
        )
      );
  }

  static async findByUserIds(userIds: string[]) {
    if (userIds.length === 0) return [];
    return await db
      .select()
      .from(portfolioValueSnapshots)
      .where(inArray(portfolioValueSnapshots.user_id, userIds))
      .orderBy(portfolioValueSnapshots.snapshot_date);
  }

  static async findByUserAndDateRange(userId: string, startDate: string, endDate: string) {
    return await db
      .select()
      .from(portfolioValueSnapshots)
      .where(
        and(
          eq(portfolioValueSnapshots.user_id, userId),
          gte(portfolioValueSnapshots.snapshot_date, startDate),
          lte(portfolioValueSnapshots.snapshot_date, endDate)
        )
      )
      .orderBy(portfolioValueSnapshots.snapshot_date);
  }

  static async upsertMany(
    rows: Array<{ user_id: string; snapshot_date: string; value: string }>,
    executor?: DbExecutor
  ) {
    for (let index = 0; index < rows.length; index += 500) {
      await resolveDb(executor)
        .insert(portfolioValueSnapshots)
        .values(rows.slice(index, index + 500))
        .onConflictDoUpdate({
          target: [portfolioValueSnapshots.user_id, portfolioValueSnapshots.snapshot_date],
          set: { value: sql`excluded.value` },
        });
    }
  }
}
