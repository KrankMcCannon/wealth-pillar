import { db } from '@/server/db/drizzle';
import { budgetPeriods } from '@/server/db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { BudgetPeriod } from '@/lib/types';
import { serialize } from '@/lib/utils/serializer';

export type InsertBudgetPeriod = typeof budgetPeriods.$inferInsert;
export type UpdateBudgetPeriod = Partial<InsertBudgetPeriod>;

export class BudgetPeriodsRepository {
  static async findById(id: string): Promise<BudgetPeriod | null> {
    const result = await db.select().from(budgetPeriods).where(eq(budgetPeriods.id, id)).limit(1);
    return result.length > 0 ? (serialize(result[0]) as unknown as BudgetPeriod) : null;
  }

  static async findActiveByUser(userId: string): Promise<BudgetPeriod | null> {
    const result = await db
      .select()
      .from(budgetPeriods)
      .where(and(eq(budgetPeriods.user_id, userId), eq(budgetPeriods.is_active, true)))
      .limit(1);
    return result.length > 0 ? (serialize(result[0]) as unknown as BudgetPeriod) : null;
  }

  static async findByUser(userId: string): Promise<BudgetPeriod[]> {
    const result = await db
      .select()
      .from(budgetPeriods)
      .where(eq(budgetPeriods.user_id, userId))
      .orderBy(desc(budgetPeriods.start_date));
    return serialize(result) as unknown as BudgetPeriod[];
  }

  static async findActiveByUserIds(userIds: string[]): Promise<BudgetPeriod[]> {
    if (userIds.length === 0) return [];
    const result = await db
      .select()
      .from(budgetPeriods)
      .where(and(inArray(budgetPeriods.user_id, userIds), eq(budgetPeriods.is_active, true)));
    return serialize(result) as unknown as BudgetPeriod[];
  }

  static async create(data: InsertBudgetPeriod): Promise<BudgetPeriod> {
    const result = await db.insert(budgetPeriods).values(data).returning();
    return serialize(result[0]) as unknown as BudgetPeriod;
  }

  static async update(id: string, data: UpdateBudgetPeriod): Promise<BudgetPeriod> {
    const result = await db
      .update(budgetPeriods)
      .set({ ...data, updated_at: new Date() })
      .where(eq(budgetPeriods.id, id))
      .returning();
    return serialize(result[0]) as unknown as BudgetPeriod;
  }

  static async delete(id: string): Promise<void> {
    await db.delete(budgetPeriods).where(eq(budgetPeriods.id, id));
  }
}
