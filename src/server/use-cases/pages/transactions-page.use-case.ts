import { getTransactionsByGroupUseCase } from '../transactions/get-transactions.use-case';
import {
  getAccountsByGroupDeduped,
  getAllCategoriesDeduped,
} from '@/server/request-cache/services';
import { getSeriesByGroupUseCase } from '../recurring/recurring.use-cases';
import { getBudgetsByGroupUseCase } from '../budgets/get-budgets.use-case';
import type {
  Transaction,
  Category,
  Account,
  RecurringTransactionSeries,
  Budget,
} from '@/lib/types';
import type { User } from '@/lib/types';
import { decodeTransactionCursor, encodeTransactionCursor } from '@/lib/utils/transaction-cursor';

export interface TransactionsPageQuery {
  user?: string;
  q?: string;
  type?: 'all' | 'income' | 'expense' | 'transfer';
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  account?: string;
  category?: string;
  page?: string;
  pageSize?: string;
  /** Opaque keyset cursor (exclusive) for sequential forward pagination */
  cursor?: string;
}

interface ResolvedTransactionsQuery {
  userId?: string;
  searchQuery?: string;
  type?: 'income' | 'expense' | 'transfer';
  startDate?: Date;
  endDate?: Date;
  accountId?: string;
  category?: string;
  page: number;
  pageSize: number;
}

export interface TransactionsPageData {
  transactions: Transaction[];
  total: number;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  /** Present when another page exists after the current window (keyset or offset). */
  nextCursor?: string;
  appliedQuery: {
    user?: string;
    q?: string;
    type: 'all' | 'income' | 'expense' | 'transfer';
    dateRange: 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';
    startDate?: string;
    endDate?: string;
    account?: string;
    category?: string;
  };
  categories: Category[];
  accounts: Account[];
  recurringSeries: RecurringTransactionSeries[];
  budgets: Budget[];
}

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

function resolveDateRange(query: TransactionsPageQuery): { startDate?: Date; endDate?: Date } {
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

function resolveTransactionsQuery(
  query: TransactionsPageQuery,
  currentUser: User
): ResolvedTransactionsQuery {
  const parsedPage = Number.parseInt(query.page ?? '1', 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const parsedPageSize = Number.parseInt(query.pageSize ?? '30', 10);
  const pageSize = [10, 20, 30, 50, 100].includes(parsedPageSize) ? parsedPageSize : 30;

  const resolvedDate = resolveDateRange(query);
  const isMember = currentUser.role === 'member';
  const userId = isMember ? currentUser.id : query.user;

  return {
    ...(userId ? { userId } : {}),
    ...(query.q?.trim() ? { searchQuery: query.q.trim() } : {}),
    ...(query.type && query.type !== 'all' ? { type: query.type } : {}),
    ...(resolvedDate.startDate ? { startDate: resolvedDate.startDate } : {}),
    ...(resolvedDate.endDate ? { endDate: resolvedDate.endDate } : {}),
    ...(query.account ? { accountId: query.account } : {}),
    ...(query.category ? { category: query.category } : {}),
    page,
    pageSize,
  };
}

function buildAppliedQuery(
  query: TransactionsPageQuery,
  currentUser: User
): TransactionsPageData['appliedQuery'] {
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
  };
}

export async function getTransactionsPageData(
  groupId: string,
  query: TransactionsPageQuery,
  currentUser: User
): Promise<TransactionsPageData> {
  const resolvedQuery = resolveTransactionsQuery(query, currentUser);
  const pageSize = resolvedQuery.pageSize;
  const page = resolvedQuery.page;
  const offset = (page - 1) * pageSize;

  const cursorToken = query.cursor?.trim();
  const decodedCursor = page > 1 && cursorToken ? decodeTransactionCursor(cursorToken) : undefined;
  const useKeyset = Boolean(page > 1 && decodedCursor);

  const fetchLimit = useKeyset ? pageSize + 1 : pageSize;
  const fetchOffset = useKeyset ? undefined : page === 1 ? 0 : offset;

  const [transactionResult, categories, accounts, recurringSeries, budgets] = await Promise.all([
    safeFetch(
      getTransactionsByGroupUseCase(groupId, {
        limit: fetchLimit,
        ...(fetchOffset !== undefined ? { offset: fetchOffset } : {}),
        ...(useKeyset && decodedCursor
          ? {
              cursorAfter: {
                date: decodedCursor.date,
                createdAt: decodedCursor.createdAt,
                id: decodedCursor.id,
              },
            }
          : {}),
        ...(resolvedQuery.userId ? { userId: resolvedQuery.userId } : {}),
        ...(resolvedQuery.searchQuery ? { searchQuery: resolvedQuery.searchQuery } : {}),
        ...(resolvedQuery.type ? { type: resolvedQuery.type } : {}),
        ...(resolvedQuery.startDate ? { startDate: resolvedQuery.startDate } : {}),
        ...(resolvedQuery.endDate ? { endDate: resolvedQuery.endDate } : {}),
        ...(resolvedQuery.accountId ? { accountId: resolvedQuery.accountId } : {}),
        ...(resolvedQuery.category ? { category: resolvedQuery.category } : {}),
      }),
      {
        data: [] as Transaction[],
        total: 0,
        hasMore: false,
      }
    ),
    safeFetch(getAllCategoriesDeduped(), [] as Category[]),
    safeFetch(getAccountsByGroupDeduped(groupId), [] as Account[]),
    safeFetch(getSeriesByGroupUseCase(groupId), [] as RecurringTransactionSeries[]),
    safeFetch(getBudgetsByGroupUseCase(groupId), [] as Budget[]),
  ]);

  let rows = transactionResult.data;
  if (useKeyset && rows.length > pageSize) {
    rows = rows.slice(0, pageSize);
  }

  const totalPages = Math.max(1, Math.ceil(transactionResult.total / pageSize));
  const hasNextPage = page < totalPages && rows.length > 0;
  const last = rows[rows.length - 1];
  const nextCursor =
    hasNextPage && last
      ? encodeTransactionCursor({
          date: last.date,
          created_at: last.created_at,
          id: last.id,
        })
      : undefined;

  return {
    transactions: rows,
    total: transactionResult.total,
    hasMore: page < totalPages,
    currentPage: page,
    totalPages,
    pageSize,
    ...(nextCursor ? { nextCursor } : {}),
    appliedQuery: buildAppliedQuery(query, currentUser),
    categories,
    accounts,
    recurringSeries,
    budgets,
  };
}
