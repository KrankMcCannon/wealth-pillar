import { cacheLife, cacheTag } from 'next/cache';
import { getTransactionsByGroupUseCase } from '../transactions/get-transactions.use-case';
import {
  getAccountsByGroupDeduped,
  getAllCategoriesDeduped,
} from '@/server/request-cache/services';
import { getBudgetsByGroupUseCase } from '../budgets/get-budgets.use-case';
import type { Transaction, Category, Account, Budget, User } from '@/lib/types';
import { scopeTransactionsListData } from '@/server/permissions/scope-page-data';
import type { TransactionFilterOptions } from '@/server/repositories/transactions.repository';
import { decodeTransactionCursor, encodeTransactionCursor } from '@/lib/utils/transaction-cursor';

/** Fixed window size for transactions list (keyset infinite scroll). */
export const TRANSACTIONS_LIST_PAGE_SIZE = 30;

export interface TransactionsListQuery {
  user?: string;
  q?: string;
  type?: 'all' | 'income' | 'expense' | 'transfer';
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  account?: string;
  category?: string;
  /** Chiavi categoria separate da virgola (es. unione categorie di più budget). */
  categories?: string;
  /** Budget filter mode: load budgets metadata for banner. */
  budget?: string;
  /** Opaque keyset cursor for load-more (server actions / internal). */
  cursor?: string;
}

export interface ResolvedTransactionFilters {
  userId?: string;
  searchQuery?: string;
  type?: 'income' | 'expense' | 'transfer';
  startDate?: Date;
  endDate?: Date;
  accountId?: string;
  category?: string;
  categoryKeys?: string[];
}

export interface TransactionsListData {
  transactions: Transaction[];
  hasMore: boolean;
  nextCursor?: string;
  appliedQuery: AppliedTransactionsQuery;
  categories: Category[];
  accounts: Account[];
  /** Present only when `?budget=` is in the URL (budget-filter banner). */
  budgets: Budget[];
}

export type AppliedTransactionsQuery = {
  user?: string;
  q?: string;
  type: 'all' | 'income' | 'expense' | 'transfer';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  account?: string;
  category?: string;
  categories?: string;
};

async function safeFetch<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    console.error(`[TransactionsPageUseCase] Fetch failed:`, e);
    return fallback;
  }
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function resolveDateRange(query: TransactionsListQuery): {
  startDate?: Date;
  endDate?: Date;
} {
  const now = new Date();
  switch (query.dateRange) {
    case 'today':
      return { startDate: startOfDay(now), endDate: endOfDay(now) };
    case 'week': {
      const start = startOfDay(now);
      start.setDate(start.getDate() - 7);
      return { startDate: start, endDate: endOfDay(now) };
    }
    case 'month': {
      const start = startOfDay(now);
      start.setDate(start.getDate() - 30);
      return { startDate: start, endDate: endOfDay(now) };
    }
    case 'year': {
      const start = startOfDay(now);
      start.setDate(start.getDate() - 365);
      return { startDate: start, endDate: endOfDay(now) };
    }
    case 'custom': {
      const customStartDate = parseDate(query.startDate);
      const customEndDate = parseDate(query.endDate);
      return {
        ...(customStartDate ? { startDate: customStartDate } : {}),
        ...(customEndDate ? { endDate: customEndDate } : {}),
      };
    }
    default:
      return {};
  }
}

export function resolveTransactionsFilters(
  query: TransactionsListQuery,
  currentUser: User
): ResolvedTransactionFilters {
  const resolvedDate = resolveDateRange(query);
  const isMember = currentUser.role === 'member';
  const userId = isMember ? currentUser.id : query.user;

  const parsedCategoryKeys = query.categories
    ? query.categories
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
    : [];

  return {
    ...(userId ? { userId } : {}),
    ...(query.q?.trim() ? { searchQuery: query.q.trim() } : {}),
    ...(query.type && query.type !== 'all' ? { type: query.type } : {}),
    ...(resolvedDate.startDate ? { startDate: resolvedDate.startDate } : {}),
    ...(resolvedDate.endDate ? { endDate: resolvedDate.endDate } : {}),
    ...(query.account ? { accountId: query.account } : {}),
    ...(parsedCategoryKeys.length > 0
      ? { categoryKeys: parsedCategoryKeys }
      : query.category
        ? { category: query.category }
        : {}),
  };
}

export function buildAppliedQuery(
  query: TransactionsListQuery,
  currentUser: User
): AppliedTransactionsQuery {
  const isMember = currentUser.role === 'member';
  return {
    ...(isMember ? { user: currentUser.id } : query.user ? { user: query.user } : {}),
    ...(query.q?.trim() ? { q: query.q.trim() } : {}),
    type: query.type ?? 'all',
    dateRange: query.dateRange ?? 'all',
    ...(query.startDate ? { startDate: query.startDate } : {}),
    ...(query.endDate ? { endDate: query.endDate } : {}),
    ...(query.account ? { account: query.account } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.categories ? { categories: query.categories } : {}),
  };
}

export function buildTransactionRepositoryOptions(
  filters: ResolvedTransactionFilters,
  options?: { cursor?: string; limit?: number }
): TransactionFilterOptions {
  const decodedCursor = options?.cursor?.trim()
    ? decodeTransactionCursor(options.cursor.trim())
    : undefined;

  return {
    limit: options?.limit ?? TRANSACTIONS_LIST_PAGE_SIZE,
    countTotal: false,
    ...(decodedCursor
      ? {
          cursorAfter: {
            date: decodedCursor.date,
            createdAt: decodedCursor.createdAt,
            id: decodedCursor.id,
          },
        }
      : {}),
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(filters.searchQuery ? { searchQuery: filters.searchQuery } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.startDate ? { startDate: filters.startDate } : {}),
    ...(filters.endDate ? { endDate: filters.endDate } : {}),
    ...(filters.accountId ? { accountId: filters.accountId } : {}),
    ...(filters.categoryKeys?.length ? { categoryKeys: filters.categoryKeys } : {}),
    ...(filters.category ? { category: filters.category } : {}),
  };
}

function encodeNextCursor(rows: Transaction[]): string | undefined {
  const last = rows[rows.length - 1];
  if (!last) return undefined;
  return encodeTransactionCursor({
    date: last.date,
    created_at: last.created_at,
    id: last.id,
  });
}

export async function getTransactionsListData(
  groupId: string,
  query: TransactionsListQuery,
  currentUser: User
): Promise<TransactionsListData> {
  const data = await getCachedTransactionsListData(
    groupId,
    query,
    currentUser.id,
    currentUser.role
  );
  return scopeTransactionsListData(data, currentUser);
}

async function getCachedTransactionsListData(
  groupId: string,
  query: TransactionsListQuery,
  userId: string,
  userRole: User['role']
): Promise<TransactionsListData> {
  'use cache';
  cacheLife('minutes');
  cacheTag(`group:${groupId}:transactions`);
  cacheTag(`group:${groupId}:accounts`);
  cacheTag('categories');
  if (query.budget?.trim()) {
    cacheTag(`group:${groupId}:budgets`);
  }

  const currentUser = { id: userId, role: userRole } as User;
  const filters = resolveTransactionsFilters(query, currentUser);
  const repoOptions = buildTransactionRepositoryOptions(filters);

  const fetchBudgets = Boolean(query.budget?.trim());

  const [transactionResult, categories, accounts, budgets] = await Promise.all([
    safeFetch(getTransactionsByGroupUseCase(groupId, repoOptions), {
      data: [] as Transaction[],
      total: 0,
      hasMore: false,
    }),
    safeFetch(getAllCategoriesDeduped(), [] as Category[]),
    safeFetch(getAccountsByGroupDeduped(groupId), [] as Account[]),
    fetchBudgets
      ? safeFetch(getBudgetsByGroupUseCase(groupId), [] as Budget[])
      : Promise.resolve([] as Budget[]),
  ]);

  const rows = transactionResult.data;
  const nextCursor = transactionResult.hasMore ? encodeNextCursor(rows) : undefined;

  return {
    transactions: rows,
    hasMore: transactionResult.hasMore,
    ...(nextCursor ? { nextCursor } : {}),
    appliedQuery: buildAppliedQuery(query, currentUser),
    categories,
    accounts,
    budgets,
  };
}

/** Uncached fetch for load-more server actions (no COUNT, keyset only). */
export async function fetchTransactionsWindow(
  groupId: string,
  query: TransactionsListQuery,
  currentUser: User
): Promise<{
  transactions: Transaction[];
  hasMore: boolean;
  nextCursor?: string;
}> {
  const filters = resolveTransactionsFilters(query, currentUser);
  const repoOptions = buildTransactionRepositoryOptions(filters, {
    ...(query.cursor ? { cursor: query.cursor } : {}),
  });
  const result = await getTransactionsByGroupUseCase(groupId, repoOptions);
  const nextCursor = result.hasMore ? encodeNextCursor(result.data) : undefined;
  return {
    transactions: result.data,
    hasMore: result.hasMore,
    ...(nextCursor ? { nextCursor } : {}),
  };
}
