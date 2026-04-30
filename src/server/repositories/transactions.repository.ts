import { db } from '@/server/db/drizzle';
import { transactions } from '@/server/db/schema';
import { and, desc, eq, or, sql, count, inArray, ilike, lt } from 'drizzle-orm';

/** Exclusive lower bound for keyset pagination (same ordering as list: date desc, created_at desc, id desc). */
export interface TransactionCursorAfter {
  date: string;
  createdAt: Date;
  id: string;
}

export interface TransactionFilterOptions {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  categoryKeys?: string[];
  type?: 'income' | 'expense' | 'transfer';
  accountId?: string;
  userId?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
  /** When set, fetches rows strictly after this cursor; do not pass offset together with this. */
  cursorAfter?: TransactionCursorAfter;
}

export type InsertTransaction = typeof transactions.$inferInsert;
export type UpdateTransaction = typeof transactions.$inferInsert;

export class TransactionsRepository {
  /**
   * Get transactions by group with filtering
   */
  static async getByGroup(groupId: string, options?: TransactionFilterOptions) {
    const filterConditions = [eq(transactions.group_id, groupId)];

    if (options?.startDate) {
      filterConditions.push(
        sql`${transactions.date} >= ${options.startDate.toISOString().split('T')[0]}`
      );
    }
    if (options?.endDate) {
      filterConditions.push(
        sql`${transactions.date} <= ${options.endDate.toISOString().split('T')[0]}`
      );
    }
    if (options?.category) {
      filterConditions.push(eq(transactions.category, options.category));
    }
    if (options?.categoryKeys?.length) {
      filterConditions.push(inArray(transactions.category, options.categoryKeys));
    }
    if (options?.type) {
      filterConditions.push(eq(transactions.type, options.type));
    }
    if (options?.accountId) {
      filterConditions.push(eq(transactions.account_id, options.accountId));
    }
    if (options?.userId) {
      filterConditions.push(eq(transactions.user_id, options.userId));
    }
    if (options?.searchQuery) {
      filterConditions.push(ilike(transactions.description, `%${options.searchQuery}%`));
    }

    const dataConditions = [...filterConditions];
    if (options?.cursorAfter) {
      const cur = options.cursorAfter;
      dataConditions.push(
        or(
          lt(transactions.date, cur.date),
          and(eq(transactions.date, cur.date), lt(transactions.created_at, cur.createdAt)),
          and(
            eq(transactions.date, cur.date),
            eq(transactions.created_at, cur.createdAt),
            lt(transactions.id, cur.id)
          )
        )!
      );
    }

    const listWhere = and(...dataConditions);

    // Count for full filter set (not narrowed by cursor)
    const countResult = await db
      .select({ total: count() })
      .from(transactions)
      .where(and(...filterConditions));
    const total = countResult[0]?.total ?? 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = db
      .select()
      .from(transactions)
      .where(listWhere)
      .orderBy(desc(transactions.date), desc(transactions.created_at), desc(transactions.id));

    if (options?.limit) {
      query = query.limit(options.limit);
      if (options.offset && !options.cursorAfter) {
        query = query.offset(options.offset);
      }
    }

    const data = await query;

    const offset = options?.offset ?? 0;
    const hasMore = options?.limit ? offset + data.length < total : false;

    return {
      data,
      total,
      hasMore,
    };
  }

  /**
   * Get transactions by user with filtering
   */
  static async getByUser(userId: string, options?: TransactionFilterOptions) {
    const conditions = [eq(transactions.user_id, userId)];

    if (options?.startDate) {
      conditions.push(
        sql`${transactions.date} >= ${options.startDate.toISOString().split('T')[0]}`
      );
    }
    if (options?.endDate) {
      conditions.push(sql`${transactions.date} <= ${options.endDate.toISOString().split('T')[0]}`);
    }
    if (options?.category) {
      conditions.push(eq(transactions.category, options.category));
    }
    if (options?.type) {
      conditions.push(eq(transactions.type, options.type));
    }

    const baseQuery = db
      .select()
      .from(transactions)
      .where(and(...conditions));

    const countResult2 = await db
      .select({ total: count() })
      .from(transactions)
      .where(and(...conditions));
    const total = countResult2[0]?.total ?? 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = baseQuery.orderBy(desc(transactions.date), desc(transactions.created_at));

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const data = await query;

    return {
      data,
      total,
    };
  }

  /**
   * Get transactions by account (including transfers)
   */
  static async getByAccount(accountId: string) {
    const data = await db
      .select()
      .from(transactions)
      .where(or(eq(transactions.account_id, accountId), eq(transactions.to_account_id, accountId)))
      .orderBy(desc(transactions.date), desc(transactions.created_at));

    return data;
  }

  /**
   * Get transaction by ID
   */
  static async getById(id: string) {
    const [row] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return row || null;
  }

  /**
   * Create a transaction
   */
  static async create(data: InsertTransaction) {
    const [row] = await db.insert(transactions).values(data).returning();
    return row;
  }

  /**
   * Update a transaction
   */
  static async update(id: string, data: Partial<UpdateTransaction>) {
    const [row] = await db
      .update(transactions)
      // updated_at will be handled or we manually pass it here
      .set({ ...data, updated_at: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return row;
  }

  /**
   * Delete a transaction
   */
  static async delete(id: string) {
    const [row] = await db.delete(transactions).where(eq(transactions.id, id)).returning();
    return row;
  }

  /**
   * Delete all transactions for a user
   */
  static async deleteByUser(userId: string) {
    await db.delete(transactions).where(eq(transactions.user_id, userId));
  }

  /**
   * Delete all transactions for an account
   */
  static async deleteByAccount(accountId: string) {
    await db
      .delete(transactions)
      .where(or(eq(transactions.account_id, accountId), eq(transactions.to_account_id, accountId)));
  }

  /**
   * Apply balance delta to an account
   */
  static async updateAccountBalance(accountId: string, deltaAmount: number) {
    // Numeric types come as string from Drizzle normally but Postgres allows basic arithmetic
    // deltaAmount is a number
    await db.execute(
      sql`UPDATE accounts SET balance = balance + ${deltaAmount} WHERE id = ${accountId}`
    );
  }
}
