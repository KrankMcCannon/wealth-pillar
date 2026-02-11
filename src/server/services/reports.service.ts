import { supabaseServer } from '@/server/db/server';
import type { Transaction, Account, BudgetPeriod, Category, User } from '@/lib/types';
import { toDateTime, formatDateShort } from '@/lib/utils';
import { ReportPeriodService } from './report-period.service';

export interface ReportParams {
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AccountTypeSummary {
  type: string;
  totalEarned: number;
  totalSpent: number;
  totalBalance: number;
}

export interface AccountMetrics {
  earned: number;
  spent: number;
  startBalance: number;
  endBalance: number;
}

export interface UserAccountFlow {
  accountType: string;
  balance: number;
  earned: number;
  spent: number;
  net: number;
}

export interface UserFlowSummary {
  userId: string;
  totalEarned: number;
  totalSpent: number;
  netFlow: number;
  accounts: UserAccountFlow[];
}

export interface ReportPeriodSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  startBalance: number;
  endBalance: number;
  totalEarned: number;
  totalSpent: number;
  metricsByAccountType: Record<string, AccountMetrics>;
  userId: string;
}

export interface CategoryStat {
  id: string;
  name: string;
  type: 'income' | 'expense';
  total: number;
  color: string;
}

/**
 * Reports Service
 * Optimized for performance and specific report view requirements
 */
export class ReportsService {
  /**
   * Fetch all necessary data for reports in parallel
   */
  static async getReportsData(groupUserIds?: string[]) {
    const supabase = supabaseServer;

    // 1. Fetch Users & Periods (filtered to group members for security)
    let usersQuery = supabase.from('users').select('id, budget_periods, budget_start_date');

    if (groupUserIds && groupUserIds.length > 0) {
      usersQuery = usersQuery.in('id', groupUserIds);
    }

    const { data: usersData, error: userError } = await usersQuery;

    if (userError) throw new Error(`ReportsService: Users fetch failed: ${userError.message}`);

    // Parse and Process Periods using Centralized Logic
    const allUsersPeriods: BudgetPeriod[] = [];
    if (usersData) {
      (usersData as User[]).forEach((u) => {
        const processed = ReportPeriodService.processUserPeriods(u);
        allUsersPeriods.push(...processed);
      });
    }

    // 2. Filter Periods
    const filteredPeriods = ReportPeriodService.filterPeriodsByRange(
      allUsersPeriods,
      undefined,
      undefined
    );

    // 3. Fetch Transactions & Data
    const query = supabase.from('transactions').select('*').order('date', { ascending: false });

    const [
      { data: transactions, error: txError },
      { data: accounts, error: accError },
      { data: categories, error: catError },
    ] = await Promise.all([
      query,
      supabase.from('accounts').select('*'),
      supabase.from('categories').select('*'),
    ]);

    if (txError) throw new Error(`ReportsService: Transactions fetch failed: ${txError.message}`);
    if (accError) throw new Error(`ReportsService: Accounts fetch failed: ${accError.message}`);
    if (catError) throw new Error(`ReportsService: Categories fetch failed: ${catError.message}`);

    return {
      transactions: (transactions as Transaction[]) || [],
      accounts: (accounts as Account[]) || [],
      periods: filteredPeriods,
      categories: (categories as Category[]) || [],
    };
  }

  /**
   * Calculate summary metrics per account type
   */
  static normalizeAccountType(type: string | undefined): string {
    if (!type) return 'other';
    const lower = type.toLowerCase();
    if (lower === 'investment' || lower === 'investments') return 'investments';
    return lower;
  }

  static calculateAccountTypeSummary(
    transactions: Transaction[],
    accounts: Account[]
  ): AccountTypeSummary[] {
    const accountMap = new Map(accounts.map((a) => [a.id, a]));
    const summaryMap = new Map<string, AccountTypeSummary>();

    // 1. Initialize summaries with current account balances
    for (const account of accounts) {
      const type = this.normalizeAccountType(account.type);
      if (!summaryMap.has(type)) {
        summaryMap.set(type, { type, totalEarned: 0, totalSpent: 0, totalBalance: 0 });
      }
      const summary = summaryMap.get(type)!;
      summary.totalBalance += account.balance || 0;
    }

    // 2. Calculate Earned/Spent flows from transactions
    for (const t of transactions) {
      const account = accountMap.get(t.account_id);
      if (!account) continue;

      const type = this.normalizeAccountType(account.type);

      if (!summaryMap.has(type)) {
        summaryMap.set(type, { type, totalEarned: 0, totalSpent: 0, totalBalance: 0 });
      }
      const summary = summaryMap.get(type)!;

      if (t.type === 'income') {
        summary.totalEarned += t.amount;
      } else if (t.type === 'expense') {
        summary.totalSpent += t.amount;
      } else if (t.type === 'transfer' && t.to_account_id) {
        const toAccount = accountMap.get(t.to_account_id);
        const toType = toAccount ? this.normalizeAccountType(toAccount.type) : null;

        if (type !== toType) {
          // Outgoing from this type
          summary.totalSpent += t.amount;

          // Incoming to other type
          if (toType) {
            if (!summaryMap.has(toType)) {
              summaryMap.set(toType, {
                type: toType,
                totalEarned: 0,
                totalSpent: 0,
                totalBalance: 0,
              });
            }
            const toSummary = summaryMap.get(toType)!;
            toSummary.totalEarned += t.amount;
          }
        }
      }
    }

    return Array.from(summaryMap.values());
  }

  /**
   * Calculate per-user money flow from actual transactions.
   * Groups by user_id and then by account type.
   */
  static calculateUserFlowSummary(
    transactions: Transaction[],
    accounts: Account[],
    userIds: string[]
  ): UserFlowSummary[] {
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    // Initialize per-user, per-account-type buckets
    const userFlows = new Map<
      string,
      Map<string, { earned: number; spent: number; balance: number }>
    >();

    for (const uid of userIds) {
      userFlows.set(uid, new Map());
    }

    // Seed with account balances (each user gets their accounts' balances)
    for (const account of accounts) {
      const type = this.normalizeAccountType(account.type);
      for (const uid of account.user_ids) {
        if (!userFlows.has(uid)) continue;
        const typeMap = userFlows.get(uid)!;
        if (!typeMap.has(type)) {
          typeMap.set(type, { earned: 0, spent: 0, balance: 0 });
        }
        typeMap.get(type)!.balance += account.balance || 0;
      }
    }

    // Aggregate transactions by user and account type
    for (const t of transactions) {
      const uid = t.user_id;
      if (!uid || !userFlows.has(uid)) continue;

      const account = accountMap.get(t.account_id);
      if (!account) continue;

      const type = this.normalizeAccountType(account.type);
      const typeMap = userFlows.get(uid)!;

      const ensureBucket = (
        m: Map<string, { earned: number; spent: number; balance: number }>,
        key: string
      ) => {
        if (!m.has(key)) m.set(key, { earned: 0, spent: 0, balance: 0 });
        return m.get(key)!;
      };

      if (t.type === 'income') {
        ensureBucket(typeMap, type).earned += t.amount;
      } else if (t.type === 'expense') {
        ensureBucket(typeMap, type).spent += t.amount;
      } else if (t.type === 'transfer' && t.to_account_id) {
        const toAccount = accountMap.get(t.to_account_id);
        if (!toAccount) continue;
        const toType = this.normalizeAccountType(toAccount.type);

        // OUT from source account type
        ensureBucket(typeMap, type).spent += t.amount;

        // IN to destination account type
        ensureBucket(typeMap, toType).earned += t.amount;
      }
    }

    // Build result
    return userIds.map((uid) => {
      const typeMap = userFlows.get(uid) || new Map();
      const accountFlows: UserAccountFlow[] = Array.from(typeMap.entries()).map(
        ([accountType, data]) => ({
          accountType,
          balance: data.balance,
          earned: data.earned,
          spent: data.spent,
          net: data.earned - data.spent,
        })
      );

      const totalEarned = accountFlows.reduce((s, a) => s + a.earned, 0);
      const totalSpent = accountFlows.reduce((s, a) => s + a.spent, 0);

      return {
        userId: uid,
        totalEarned,
        totalSpent,
        netFlow: totalEarned - totalSpent,
        accounts: accountFlows.sort((a, b) => b.balance - a.balance),
      };
    });
  }

  /**
   * Group transactions into enriched budget periods
   */
  static calculatePeriodSummaries(
    periods: BudgetPeriod[],
    transactions: Transaction[],
    accounts: Account[]
  ): ReportPeriodSummary[] {
    // 1. Sort periods chronologically DESCENDING (Newest first)
    const sortedPeriods = [...periods].sort((a, b) => {
      const aTime = toDateTime(a.start_date)?.toMillis() || 0;
      const bTime = toDateTime(b.start_date)?.toMillis() || 0;
      return bTime - aTime;
    });

    // 2. Initialize Running Balances from Current Account Balances
    // Map<UserId, Map<AccountType, Balance>>
    const userTypeBalances = new Map<string, Map<string, number>>();

    // Initialize with current balances
    for (const acc of accounts) {
      const type = this.normalizeAccountType(acc.type);

      acc.user_ids.forEach((uid) => {
        if (!userTypeBalances.has(uid)) {
          userTypeBalances.set(uid, new Map());
        }
        const userBalances = userTypeBalances.get(uid)!;
        const current = userBalances.get(type) || 0;

        // IMPORTANT: Logic for shared accounts?
        // If an account is shared, its balance is the total.
        // We assign the full balance to the view?
        // Or do we split it?
        // Current dashboard simply sums them up.
        userBalances.set(type, current + (acc.balance || 0));
      });
    }

    return sortedPeriods
      .map((period) => {
        const pStart = toDateTime(period.start_date);
        const pEnd = toDateTime(period.end_date ?? new Date()); // Default to now if active
        if (!pStart || !pEnd) return null;

        // Filter transactions for this period AND this user
        const pTransactions = transactions.filter((t) => {
          // STRICT USER ISOLATION: Only count transactions for this period's user
          if (t.user_id !== period.user_id) return false;

          const date = toDateTime(t.date);
          return date && date >= pStart && date <= pEnd;
        });

        // Metrics
        let totalEarned = 0;
        let totalSpent = 0;

        // Account Type Metrics
        const metricsByAccountType: Record<
          string,
          { earned: number; spent: number; startBalance: number; endBalance: number }
        > = {};
        const accountMap = new Map(accounts.map((a) => [a.id, a]));

        // 3. Calculate Flows (Earned/Spent) for this period
        for (const t of pTransactions) {
          const account = accountMap.get(t.account_id);
          if (!account) continue;
          const type = this.normalizeAccountType(account.type);

          if (!metricsByAccountType[type]) {
            metricsByAccountType[type] = { earned: 0, spent: 0, startBalance: 0, endBalance: 0 };
          }

          if (t.type === 'income') {
            totalEarned += t.amount;
            metricsByAccountType[type].earned += t.amount;
          } else if (t.type === 'expense') {
            totalSpent += t.amount;
            metricsByAccountType[type].spent += t.amount;
          } else if (t.type === 'transfer' && t.to_account_id) {
            const toAccount = accountMap.get(t.to_account_id);
            const toType = toAccount ? this.normalizeAccountType(toAccount.type) : null;

            if (type !== toType) {
              metricsByAccountType[type].spent += t.amount;
              totalSpent += t.amount;

              if (toType) {
                if (!metricsByAccountType[toType]) {
                  metricsByAccountType[toType] = {
                    earned: 0,
                    spent: 0,
                    startBalance: 0,
                    endBalance: 0,
                  };
                }
                metricsByAccountType[toType].earned += t.amount;
              }
            }
          }
        }

        // 4. Calculate Balances using Rollback Logic
        // Get current running balances for this user
        const userBalances = userTypeBalances.get(period.user_id) || new Map<string, number>();

        // Ensure all types in this period exist in userBalances (if they had 0 balance initially but active flow)
        Object.keys(metricsByAccountType).forEach((type) => {
          if (!userBalances.has(type)) {
            userBalances.set(type, 0); // Assume 0 if not present in accounts (shouldn't happen if account exists)
          }
        });

        // Process each type involved in flows OR holding a balance
        // We need to iterate ALL types that have a balance, not just those with activity
        const allTypes = new Set([...Object.keys(metricsByAccountType), ...userBalances.keys()]);

        allTypes.forEach((type) => {
          const currentEndBalance = userBalances.get(type) || 0;

          // Get flows for this period
          // Initialize if missing to ensure "Always Show" requirement
          if (!metricsByAccountType[type]) {
            metricsByAccountType[type] = { earned: 0, spent: 0, startBalance: 0, endBalance: 0 };
          }
          const metrics = metricsByAccountType[type];

          const netChange = metrics.earned - metrics.spent;
          const calculatedStartBalance = currentEndBalance - netChange;

          // Update Metrics - ALWAYS update balances
          metrics.endBalance = currentEndBalance;
          metrics.startBalance = calculatedStartBalance;

          // Update Running Balance for NEXT iteration (older period)
          userBalances.set(type, calculatedStartBalance);
        });

        // Re-calculating global totals strictly (pure Income - Expense)
        totalEarned = pTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        totalSpent = pTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          id: period.id,
          name: `${formatDateShort(period.start_date)} - ${period.end_date ? formatDateShort(period.end_date) : 'Present'}`,
          startDate: period.start_date as string,
          endDate: (period.end_date || new Date().toISOString().split('T')[0]) as string,
          startBalance: Object.values(metricsByAccountType).reduce(
            (sum, m) => sum + m.startBalance,
            0
          ),
          endBalance: Object.values(metricsByAccountType).reduce((sum, m) => sum + m.endBalance, 0),
          totalEarned,
          totalSpent,
          metricsByAccountType,
          userId: period.user_id,
        };
      })
      .filter(Boolean) as ReportPeriodSummary[];
  }

  /**
   * Calculate Category Statistics
   */
  static calculateCategoryStats(
    transactions: Transaction[],
    categories: Category[]
  ): { income: CategoryStat[]; expense: CategoryStat[] } {
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const statsMap = new Map<string, CategoryStat>();

    for (const t of transactions) {
      if (t.type === 'transfer') continue; // Skip transfers for category stats

      const catId = t.category;
      let catKey = catId;
      const category =
        categoryMap.get(catId) ||
        Array.from(categoryMap.values()).find((c) => c.key.toLowerCase() === catId.toLowerCase());
      if (category) catKey = category.id;

      if (!statsMap.has(catKey)) {
        statsMap.set(catKey, {
          id: catKey,
          name: category?.label || catId,
          type: t.type as 'income' | 'expense',
          total: 0,
          color: category?.color || '#cbd5e1',
        });
      }

      const stat = statsMap.get(catKey)!;
      stat.total += t.amount;
    }

    const allStats = Array.from(statsMap.values());
    const income = allStats.filter((s) => s.type === 'income').sort((a, b) => b.total - a.total);
    const expense = allStats.filter((s) => s.type === 'expense').sort((a, b) => b.total - a.total);

    return { income, expense };
  }

  /**
   * Calculate Time Trends (When I spent)
   * Aggregates spending by Day/Week over the selected range
   */
  static calculateTimeTrends(transactions: Transaction[], range: { start: Date; end: Date }) {
    const dailyMap = new Map<string, { date: string; income: number; expense: number }>();

    transactions.forEach((t) => {
      const date = toDateTime(t.date);
      // Compare JS Dates for performance and safety
      if (!date || date.toJSDate() < range.start || date.toJSDate() > range.end) return;
      if (t.type === 'transfer') return;

      // Use ISO date key (YYYY-MM-DD) for reliable client-side filtering
      const key = date.toISODate() || formatDateShort(t.date);
      if (!dailyMap.has(key)) {
        dailyMap.set(key, { date: key, income: 0, expense: 0 });
      }
      const entry = dailyMap.get(key)!;

      if (t.type === 'income') entry.income += t.amount;
      if (t.type === 'expense') entry.expense += t.amount;
    });

    return Array.from(dailyMap.values()).sort(
      // Sort chronologically ascending (Left to Right)
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  /**
   * Calculate Budget Flow
   * Returns flow data for Sankey/Flow visualization
   */
  static calculateBudgetFlow(periodSummary: ReportPeriodSummary) {
    // Nodes: Start Balance, Income Sources, Budget/Accounts, Expenses, End Balance
    // This maps the 'metricsByAccountType' to a flow structure

    // Simple version: Start -> Accounts -> End
    // + Income -> Accounts
    // Accounts -> Expense

    const nodes = [
      { id: 'start', label: 'Starting Money', value: periodSummary.startBalance },
      { id: 'income', label: 'Income', value: periodSummary.totalEarned },
      ...Object.keys(periodSummary.metricsByAccountType).map((type) => ({
        id: `account-${type}`,
        label: type.charAt(0).toUpperCase() + type.slice(1),
        value: periodSummary.metricsByAccountType[type].endBalance,
      })),
      { id: 'expense', label: 'Expenses', value: periodSummary.totalSpent },
      { id: 'end', label: 'Ending Money', value: periodSummary.endBalance },
    ];

    const links: { source: string; target: string; value: number }[] = [];

    // Flows
    Object.entries(periodSummary.metricsByAccountType).forEach(([type, metrics]) => {
      // Start -> Account
      if (metrics.startBalance > 0) {
        links.push({ source: 'start', target: `account-${type}`, value: metrics.startBalance });
      }
      // Income -> Account
      if (metrics.earned > 0) {
        links.push({ source: 'income', target: `account-${type}`, value: metrics.earned });
      }
      // Account -> Expense
      if (metrics.spent > 0) {
        links.push({ source: `account-${type}`, target: 'expense', value: metrics.spent });
      }
      // Account -> End
      if (metrics.endBalance > 0) {
        links.push({ source: `account-${type}`, target: 'end', value: metrics.endBalance });
      }
    });

    return { nodes, links };
  }

  /**
   * Fetch spending trends for a specific user and range
   */
  static async getSpendingTrends(userId: string, start?: Date, end?: Date) {
    const supabase = supabaseServer;
    let query = supabase.from('transactions').select('*').eq('user_id', userId);

    if (start) query = query.gte('date', start.toISOString());
    if (end) query = query.lte('date', end.toISOString());

    const { data, error } = await query;
    if (error) throw new Error(`ReportsService: Spending trends fetch failed: ${error.message}`);

    const rangeStart = start || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const rangeEnd = end || new Date();

    return this.calculateTimeTrends((data as Transaction[]) || [], {
      start: rangeStart,
      end: rangeEnd,
    });
  }
}
