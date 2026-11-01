import { lockPortfolio } from './portfolio-lock';
import { resolveDb, type DbExecutor } from './db-executor';
import { PortfolioSnapshotRepository } from './portfolio-snapshot.repository';
import { financialDateKey } from '@/lib/utils/financial-date';
import { db } from '@/server/db/drizzle';
import { investments } from '@/server/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

export class InvestmentRepository {
  static async findByUser(userId: string, executor?: DbExecutor) {
    return await resolveDb(executor)
      .select()
      .from(investments)
      .where(eq(investments.user_id, userId))
      .orderBy(investments.created_at);
  }

  static async findByUsers(userIds: string[]) {
    if (userIds.length === 0) return [];
    return await db
      .select()
      .from(investments)
      .where(inArray(investments.user_id, userIds))
      .orderBy(investments.created_at);
  }

  static async getTotalsByUsers(userIds: string[]) {
    if (userIds.length === 0) {
      return { totalInvested: 0, totalTaxPaid: 0, count: 0 };
    }

    const [result] = await db
      .select({
        totalInvested: sql<string>`coalesce(sum(${investments.amount}), 0)`,
        totalTaxPaid: sql<string>`coalesce(sum(${investments.tax_paid}), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(investments)
      .where(inArray(investments.user_id, userIds));

    return {
      totalInvested: Number(result?.totalInvested ?? 0),
      totalTaxPaid: Number(result?.totalTaxPaid ?? 0),
      count: result?.count ?? 0,
    };
  }

  static async findById(id: string) {
    const records = await db.select().from(investments).where(eq(investments.id, id));
    return records.length > 0 ? records[0] : null;
  }

  static async findByIdAndUser(id: string, userId: string) {
    const records = await db
      .select()
      .from(investments)
      .where(and(eq(investments.id, id), eq(investments.user_id, userId)));
    return records.length > 0 ? records[0] : null;
  }

  static async create(data: typeof investments.$inferInsert) {
    return db.transaction(async (tx) => {
      await lockPortfolio(data.user_id, tx);
      const [row] = await tx.insert(investments).values(data).returning();
      if (row)
        await PortfolioSnapshotRepository.deleteFrom(
          row.user_id,
          financialDateKey(row.created_at ?? new Date()),
          tx
        );
      return row ?? null;
    });
  }

  static async update(id: string, data: Partial<typeof investments.$inferInsert>, userId: string) {
    return db.transaction(async (tx) => {
      await lockPortfolio(userId, tx);
      const [previous] = await tx
        .select()
        .from(investments)
        .where(and(eq(investments.id, id), eq(investments.user_id, userId)))
        .for('update');
      if (!previous) return null;
      const [row] = await tx
        .update(investments)
        .set({ ...data, user_id: userId, updated_at: new Date() })
        .where(and(eq(investments.id, id), eq(investments.user_id, userId)))
        .returning();
      if (row) {
        const first = financialDateKey(previous.created_at ?? new Date());
        const next = financialDateKey(row.created_at ?? new Date());
        await PortfolioSnapshotRepository.deleteFrom(userId, first < next ? first : next, tx);
      }
      return row ?? null;
    });
  }

  static async delete(id: string, userId: string) {
    return db.transaction(async (tx) => {
      await lockPortfolio(userId, tx);
      const [row] = await tx
        .delete(investments)
        .where(and(eq(investments.id, id), eq(investments.user_id, userId)))
        .returning();
      if (row)
        await PortfolioSnapshotRepository.deleteFrom(
          userId,
          financialDateKey(row.created_at ?? new Date()),
          tx
        );
      return row ?? null;
    });
  }
}
