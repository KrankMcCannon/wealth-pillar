import { db } from '@/server/db/drizzle';
import { sql } from 'drizzle-orm';

export interface CategorySpendingResult {
  category: string;
  spent: number;
  transaction_count: number;
}

export interface MonthlySpendingResult {
  month: string;
  income: number;
  expense: number;
}

export interface UserCategorySpendingResult {
  user_id: string;
  category: string;
  spent: number;
  income: number;
  transaction_count: number;
}

export class ReportsRepository {
  static async getGroupCategorySpending(
    groupId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CategorySpendingResult[]> {
    const result = await db.execute(sql`
      SELECT * FROM get_group_category_spending(
        ${groupId}, 
        ${startDate.toISOString()}::timestamp, 
        ${endDate.toISOString()}::timestamp
      )
    `);
    return result as unknown as CategorySpendingResult[];
  }

  static async getGroupMonthlySpending(
    groupId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MonthlySpendingResult[]> {
    const result = await db.execute(sql`
      SELECT * FROM get_group_monthly_spending(
        ${groupId}, 
        ${startDate.toISOString()}::timestamp, 
        ${endDate.toISOString()}::timestamp
      )
    `);
    return result as unknown as MonthlySpendingResult[];
  }

  static async getGroupUserCategorySpending(
    groupId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UserCategorySpendingResult[]> {
    const result = await db.execute(sql`
      SELECT * FROM get_group_user_category_spending(
        ${groupId}, 
        ${startDate.toISOString()}::timestamp, 
        ${endDate.toISOString()}::timestamp
      )
    `);
    return result as unknown as UserCategorySpendingResult[];
  }
}
