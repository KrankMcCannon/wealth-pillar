import { financialDateKey } from '@/lib/utils/financial-date';
import { db } from '@/server/db/drizzle';
import { transactions, accounts } from '@/server/db/schema';
import { and, desc, eq, or, sql, count, inArray, ilike, lt, getTableColumns } from 'drizzle-orm';
import { resolveDb, type DbExecutor } from '@/server/repositories/db-executor';
import type { FinancialLedgerRow } from '@/server/ledger/aggregate';

export interface TransactionScope {
  groupId?: string;
  userId?: string;
}

/** Exclusive lower bound for keyset pagination (same ordering as list: date desc, created_at desc, id desc). */
export interface TransactionCursorAfter {
  date: string;
  createdAt: string;
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
  /** When false, skips COUNT(*) and uses limit+1 overflow for hasMore (keyset / infinite scroll). Default true. */
  countTotal?: boolean;
}

export type TransactionLedgerRow = Omit<typeof transactions.$inferSelect, 'created_at'> & {
  created_at: string | null;
};

export type InsertTransaction = typeof transactions.$inferInsert;
export type UpdateTransaction = typeof transactions.$inferInsert;

function transactionConditions(id: string, scope?: TransactionScope) {
  return and(
    eq(transactions.id, id),
    scope?.groupId ? eq(transactions.group_id, scope.groupId) : undefined,
    scope?.userId ? eq(transactions.user_id, scope.userId) : undefined
  );
}

export class TransactionsRepository {
  /** SQL removes per-entry payloads while retaining every dimension used by the ledger rules. */
  static async aggregateByGroup(
    groupId: string,
    options: Pick<TransactionFilterOptions, 'startDate' | 'endDate' | 'categoryKeys'> = {},
    executor?: DbExecutor
  ): Promise<FinancialLedgerRow[]> {
    if (!groupId?.trim()) throw new Error('Group ID is required');
    const rows = await resolveDb(executor)
      .select({
        date: transactions.date,
        user_id: transactions.user_id,
        account_id: transactions.account_id,
        to_account_id: transactions.to_account_id,
        type: transactions.type,
        category: transactions.category,
        amount: sql<string>`sum(${transactions.amount})`,
        transaction_count: count(),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.group_id, groupId),
          options.startDate
            ? sql`${transactions.date} >= ${financialDateKey(options.startDate)}`
            : undefined,
          options.endDate
            ? sql`${transactions.date} <= ${financialDateKey(options.endDate)}`
            : undefined,
          options.categoryKeys?.length
            ? inArray(transactions.category, options.categoryKeys)
            : undefined
        )
      )
      .groupBy(
        transactions.date,
        transactions.user_id,
        transactions.account_id,
        transactions.to_account_id,
        transactions.type,
        transactions.category
      );
    return rows.map((row, index) => ({
      ...row,
      id: `aggregate:${index}`,
      group_id: groupId,
      description: '',
      created_at: row.date,
      updated_at: row.date,
      amount: Number(row.amount),
    })) as FinancialLedgerRow[];
  }

  static async getAccountBalanceState(accountIds: string[], executor: DbExecutor) {
    const ids = [...new Set(accountIds)];
    if (!ids.length) return { accountBalances: {}, accountBalanceVersions: {} };
    const rows = await executor
      .select({
        id: accounts.id,
        balance: accounts.balance,
        version: sql<string>`${accounts.balance_version}::text`,
      })
      .from(accounts)
      .where(inArray(accounts.id, ids));
    return {
      accountBalances: Object.fromEntries(rows.map((row) => [row.id, Number(row.balance)])),
      accountBalanceVersions: Object.fromEntries(rows.map((row) => [row.id, row.version])),
    };
  }
  /** Bounded keyset scans keep financial calculations complete without an unbounded SQL result. */
  static async *scanByGroup(
    groupId: string,
    options: Pick<
      TransactionFilterOptions,
      'startDate' | 'endDate' | 'userId' | 'categoryKeys'
    > = {},
    executor?: DbExecutor
  ): AsyncGenerator<TransactionLedgerRow[]> {
    let cursorAfter: TransactionCursorAfter | undefined;
    do {
      const page = await this.getByGroup(
        groupId,
        {
          ...options,
          limit: 1000,
          countTotal: false,
          ...(cursorAfter ? { cursorAfter } : {}),
        },
        executor
      );
      const rows = page.data as TransactionLedgerRow[];
      if (rows.length) yield rows;
      if (!page.hasMore) return;
      const last = rows.at(-1);
      if (!last?.date || !last.created_at) throw new Error('Invalid ledger pagination cursor');
      cursorAfter = { date: last.date, createdAt: last.created_at, id: last.id };
    } while (true);
  }

  /**
   * Get transactions by group with filtering
   */
  static async getByGroup(
    groupId: string,
    options?: TransactionFilterOptions,
    executor?: DbExecutor
  ) {
    const dbConn = resolveDb(executor);
    const filterConditions = [eq(transactions.group_id, groupId)];

    if (options?.startDate) {
      filterConditions.push(sql`${transactions.date} >= ${financialDateKey(options.startDate)}`);
    }
    if (options?.endDate) {
      filterConditions.push(sql`${transactions.date} <= ${financialDateKey(options.endDate)}`);
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
      filterConditions.push(
        or(
          eq(transactions.account_id, options.accountId),
          eq(transactions.to_account_id, options.accountId)
        )!
      );
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
          and(
            eq(transactions.date, cur.date),
            sql`${transactions.created_at} < ${cur.createdAt}::timestamptz`
          ),
          and(
            eq(transactions.date, cur.date),
            sql`${transactions.created_at} = ${cur.createdAt}::timestamptz`,
            lt(transactions.id, cur.id)
          )
        )!
      );
    }

    const listWhere = and(...dataConditions);

    const countTotal = options?.countTotal !== false;
    const pageLimit = options?.limit ?? 0;

    let total = 0;
    if (countTotal) {
      const countResult = await dbConn
        .select({ total: count() })
        .from(transactions)
        .where(and(...filterConditions));
      total = countResult[0]?.total ?? 0;
    }

    const fetchLimit =
      pageLimit > 0 && !countTotal ? pageLimit + 1 : pageLimit > 0 ? pageLimit : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = dbConn
      .select({
        ...getTableColumns(transactions),
        // JS Date truncates PostgreSQL microseconds. Bulk imports share a
        // timestamp, so losing precision here can skip every subsequent row.
        created_at: sql<string>`${transactions.created_at}::text`,
      })
      .from(transactions)
      .where(listWhere)
      .orderBy(desc(transactions.date), desc(transactions.created_at), desc(transactions.id));

    if (fetchLimit) {
      query = query.limit(fetchLimit);
      if (countTotal && options?.offset && !options.cursorAfter) {
        query = query.offset(options.offset);
      }
    }

    const rawData = await query;

    let data = rawData;
    let hasMore = false;

    if (!countTotal && pageLimit > 0) {
      hasMore = rawData.length > pageLimit;
      if (hasMore) {
        data = rawData.slice(0, pageLimit);
      }
    } else if (countTotal && pageLimit > 0) {
      const offset = options?.offset ?? 0;
      hasMore = offset + data.length < total;
    }

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
      conditions.push(sql`${transactions.date} >= ${financialDateKey(options.startDate)}`);
    }
    if (options?.endDate) {
      conditions.push(sql`${transactions.date} <= ${financialDateKey(options.endDate)}`);
    }
    if (options?.category) {
      conditions.push(eq(transactions.category, options.category));
    }
    if (options?.categoryKeys?.length) {
      conditions.push(inArray(transactions.category, options.categoryKeys));
    }
    if (options?.type) {
      conditions.push(eq(transactions.type, options.type));
    }

    const listWhere = and(...conditions);

    let query = db
      .select()
      .from(transactions)
      .where(listWhere)
      .orderBy(desc(transactions.date), desc(transactions.created_at));

    if (options?.limit) {
      query = query.limit(options.limit) as typeof query;
    }

    const data = await query;

    return {
      data,
      total: data.length,
    };
  }

  /**
   * Get transactions by account (including transfers)
   */
  static async getByAccount(accountId: string, executor?: DbExecutor) {
    const data = await resolveDb(executor)
      .select()
      .from(transactions)
      .where(or(eq(transactions.account_id, accountId), eq(transactions.to_account_id, accountId)))
      .orderBy(desc(transactions.date), desc(transactions.created_at));

    return data;
  }

  /**
   * Get transaction by ID
   */
  static async getById(id: string, scope?: TransactionScope, executor?: DbExecutor) {
    const dbConn = resolveDb(executor);
    const [row] = await dbConn
      .select()
      .from(transactions)
      .where(transactionConditions(id, scope))
      .limit(1);
    return row || null;
  }

  /** Call inside the mutation transaction, before deriving the previous balance effect. */
  static async getByIdForUpdate(
    id: string,
    scope: TransactionScope | undefined,
    executor: DbExecutor
  ) {
    const [row] = await executor
      .select()
      .from(transactions)
      .where(transactionConditions(id, scope))
      .limit(1)
      .for('update');
    return row ?? null;
  }

  /**
   * Create a transaction
   */
  static async create(data: InsertTransaction, executor?: DbExecutor) {
    const dbConn = resolveDb(executor);
    const [row] = await dbConn.insert(transactions).values(data).returning();
    return row;
  }

  /**
   * Bulk insert transactions; skips rows that conflict on (account_id, import_hash).
   */
  static async createMany(data: InsertTransaction[], executor?: DbExecutor) {
    if (data.length === 0) return [];
    const dbConn = resolveDb(executor);
    return dbConn
      .insert(transactions)
      .values(data)
      .onConflictDoNothing({
        target: [transactions.account_id, transactions.import_hash],
        where: sql`${transactions.import_hash} IS NOT NULL`,
      })
      .returning();
  }

  static async findByAccountDateRange(
    accountId: string,
    startDate: string,
    endDate: string,
    executor?: DbExecutor
  ) {
    const dbConn = resolveDb(executor);
    return dbConn
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.account_id, accountId),
          sql`${transactions.date} >= ${startDate}`,
          sql`${transactions.date} <= ${endDate}`
        )
      );
  }

  static async findImportHashesForAccount(
    accountId: string,
    hashes: string[],
    executor?: DbExecutor
  ): Promise<string[]> {
    if (hashes.length === 0) return [];
    const dbConn = resolveDb(executor);
    const rows = await dbConn
      .select({ import_hash: transactions.import_hash })
      .from(transactions)
      .where(
        and(eq(transactions.account_id, accountId), inArray(transactions.import_hash, hashes))
      );
    return rows
      .map((row) => row.import_hash)
      .filter((hash): hash is string => typeof hash === 'string' && hash.length > 0);
  }

  static async findManualDuplicatesForAccount(
    accountId: string,
    startDate: string,
    endDate: string,
    executor?: DbExecutor
  ) {
    const dbConn = resolveDb(executor);
    return dbConn
      .select({
        date: transactions.date,
        amount: transactions.amount,
        type: transactions.type,
        description: transactions.description,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.account_id, accountId),
          sql`${transactions.date} >= ${startDate}`,
          sql`${transactions.date} <= ${endDate}`,
          sql`${transactions.import_hash} IS NULL`
        )
      );
  }

  /**
   * Update a transaction
   */
  static async update(id: string, data: Partial<UpdateTransaction>, executor?: DbExecutor) {
    const dbConn = resolveDb(executor);
    const [row] = await dbConn
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
  static async delete(id: string, executor?: DbExecutor, scope?: TransactionScope) {
    const dbConn = resolveDb(executor);
    const [row] = await dbConn
      .delete(transactions)
      .where(transactionConditions(id, scope))
      .returning();
    return row;
  }

  /**
   * Delete all transactions for a user
   */
  static async deleteByUser(userId: string, executor?: DbExecutor) {
    return resolveDb(executor)
      .delete(transactions)
      .where(eq(transactions.user_id, userId))
      .returning();
  }

  /**
   * Delete all transactions for an account
   */
  static async deleteByAccount(accountId: string, executor?: DbExecutor) {
    return resolveDb(executor)
      .delete(transactions)
      .where(or(eq(transactions.account_id, accountId), eq(transactions.to_account_id, accountId)))
      .returning();
  }

  /**
   * Distinct category keys referenced by transactions in a group
   */
  static async getUsedCategoryKeysByGroup(groupId: string): Promise<string[]> {
    const rows = await db
      .selectDistinct({ category: transactions.category })
      .from(transactions)
      .where(and(eq(transactions.group_id, groupId), sql`${transactions.category} IS NOT NULL`));

    return rows
      .map((row) => row.category)
      .filter((key): key is string => typeof key === 'string' && key.length > 0);
  }

  /**
   * Apply balance delta to an account
   */
  static async updateAccountBalance(accountId: string, deltaAmount: number, executor?: DbExecutor) {
    const dbConn = resolveDb(executor);
    await dbConn.execute(
      sql`UPDATE accounts SET balance = balance + ${deltaAmount}, updated_at = clock_timestamp() WHERE id = ${accountId}`
    );
  }
}
