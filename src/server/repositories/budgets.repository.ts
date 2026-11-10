import { budgetReadColumns } from './relational-projections';
import { resolveDb, type DbExecutor } from './db-executor';
import { budgets } from '@/server/db/schema';
import { and, eq } from 'drizzle-orm';
import type { Budget } from '@/lib/types';
import { serialize } from '@/lib/utils/serializer';

export type InsertBudget = typeof budgets.$inferInsert;
export type UpdateBudget = Partial<InsertBudget>;

export interface BudgetScope {
  groupId: string;
  userId?: string;
}

function budgetConditions(id: string, scope?: BudgetScope) {
  return and(
    eq(budgets.id, id),
    scope ? eq(budgets.group_id, scope.groupId) : undefined,
    scope?.userId ? eq(budgets.user_id, scope.userId) : undefined
  );
}

export class BudgetsRepository {
  static async getById(id: string, scope?: BudgetScope): Promise<Budget | null> {
    const result = await resolveDb()
      .select(budgetReadColumns())
      .from(budgets)
      .where(budgetConditions(id, scope))
      .limit(1);
    return result.length > 0 ? (serialize(result[0]) as unknown as Budget) : null;
  }

  static async getByUser(userId: string, executor?: DbExecutor): Promise<Budget[]> {
    const result = await resolveDb(executor)
      .select(budgetReadColumns())
      .from(budgets)
      .where(eq(budgets.user_id, userId));
    return serialize(result) as unknown as Budget[];
  }

  static async getByGroup(groupId: string): Promise<Budget[]> {
    const result = await resolveDb()
      .select(budgetReadColumns())
      .from(budgets)
      .where(eq(budgets.group_id, groupId));
    return serialize(result) as unknown as Budget[];
  }

  static async create(data: InsertBudget): Promise<Budget> {
    const result = await resolveDb().insert(budgets).values(data).returning();
    return serialize(result[0]) as unknown as Budget;
  }

  static async update(id: string, data: UpdateBudget, scope?: BudgetScope): Promise<Budget> {
    const result = await resolveDb()
      .update(budgets)
      .set(data)
      .where(budgetConditions(id, scope))
      .returning();
    if (!result[0]) throw new Error('Budget not found');
    return serialize(result[0]) as unknown as Budget;
  }

  static async delete(id: string, scope?: BudgetScope): Promise<void> {
    const result = await resolveDb()
      .delete(budgets)
      .where(budgetConditions(id, scope))
      .returning({ id: budgets.id });
    if (!result[0]) throw new Error('Budget not found');
  }

  static async deleteByUser(userId: string): Promise<void> {
    await resolveDb().delete(budgets).where(eq(budgets.user_id, userId));
  }
}
