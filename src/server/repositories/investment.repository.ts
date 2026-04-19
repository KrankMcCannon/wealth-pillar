import { db } from '@/server/db/drizzle';
import { investments } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

export class InvestmentRepository {
  static async findByUser(userId: string) {
    return await db
      .select()
      .from(investments)
      .where(eq(investments.user_id, userId))
      .orderBy(investments.created_at);
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
