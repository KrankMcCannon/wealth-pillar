import { db } from '@/server/db/drizzle';
import { investments } from '@/server/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

export class InvestmentRepository {
  static async findByUser(userId: string) {
    return await db
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
    const records = await db.insert(investments).values(data).returning();
    return records.length > 0 ? records[0] : null;
  }

  static async update(id: string, data: Partial<typeof investments.$inferInsert>) {
    const records = await db
      .update(investments)
      .set({ ...data, updated_at: new Date() })
      .where(eq(investments.id, id))
      .returning();
    return records.length > 0 ? records[0] : null;
  }

  static async delete(id: string) {
    const records = await db.delete(investments).where(eq(investments.id, id)).returning();
    return records.length > 0 ? records[0] : null;
  }
}
