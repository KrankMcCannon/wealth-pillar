import { db } from '@/server/db/drizzle';
import { budgets } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Budget } from '@/lib/types';
import { serialize } from '@/lib/utils/serializer';

export type InsertBudget = typeof budgets.$inferInsert;
export type UpdateBudget = Partial<InsertBudget>;

export class BudgetsRepository {
  static async getById(id: string): Promise<Budget | null> {
    const result = await db.select().from(budgets).where(eq(budgets.id, id)).limit(1);
    return result.length > 0 ? (serialize(result[0]) as unknown as Budget) : null;
  }

  static async getByUser(userId: string): Promise<Budget[]> {
    const result = await db.select().from(budgets).where(eq(budgets.user_id, userId));
    return serialize(result) as unknown as Budget[];
  }

  static async getByGroup(groupId: string): Promise<Budget[]> {
    const result = await db.select().from(budgets).where(eq(budgets.group_id, groupId));
    return serialize(result) as unknown as Budget[];
  }

  static async create(data: InsertBudget): Promise<Budget> {
    const result = await db.insert(budgets).values(data).returning();
    return serialize(result[0]) as unknown as Budget;
  }

  static async update(id: string, data: UpdateBudget): Promise<Budget> {
    const result = await db.update(budgets).set(data).where(eq(budgets.id, id)).returning();
    return serialize(result[0]) as unknown as Budget;
  }

  static async delete(id: string): Promise<void> {
    await db.delete(budgets).where(eq(budgets.id, id));
  }

  static async deleteByUser(userId: string): Promise<void> {
    await db.delete(budgets).where(eq(budgets.user_id, userId));
  }
}
