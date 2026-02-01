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
  static async getReportsData() {
    const supabase = supabaseServer;

    // 1. Fetch Users & Periods FIRST
    const { data: usersData, error: userError } = await supabase
      .from('users')
      .select('id, budget_periods, budget_start_date');

    if (userError) throw new Error(`ReportsService: Users fetch failed: ${userError.message}`);

    // Parse and Process Periods using Centralized Logic
    const allUsersPeriods: BudgetPeriod[] = [];
    if (usersData) {
      (usersData as User[]).forEach(u => {
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
    const query = supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    const [
      { data: transactions, error: txError },
      { data: accounts, error: accError },
      { data: categories, error: catError }
    ] = await Promise.all([
      query,
      supabase.from('accounts').select('*'),
      supabase.from('categories').select('*')
    ]);

    if (txError) throw new Error(`ReportsService: Transactions fetch failed: ${txError.message}`);
    if (accError) throw new Error(`ReportsService: Accounts fetch failed: ${accError.message}`);
    if (catError) throw new Error(`ReportsService: Categories fetch failed: ${catError.message}`);

    return {
      transactions: (transactions as Transaction[]) || [],
      accounts: (accounts as Account[]) || [],
      periods: filteredPeriods,
      categories: (categories as Category[]) || []
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
    const accountMap = new Map(accounts.map(a => [a.id, a]));
    const summaryMap = new Map<string, AccountTypeSummary>();

    // 1. Initialize summaries with current account balances
    for (const account of accounts) {
      const type = this.normalizeAccountType(account.type);
      if (!summaryMap.has(type)) {
        summaryMap.set(type, { type, totalEarned: 0, totalSpent: 0, totalBalance: 0 });
      }
      const summary = summaryMap.get(type)!;
      summary.totalBalance += (account.balance || 0);
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
      }
      else if (t.type === 'transfer' && t.to_account_id) {
        const toAccount = accountMap.get(t.to_account_id);
        const toType = toAccount ? this.normalizeAccountType(toAccount.type) : null;

        if (type !== toType) {
          // Outgoing from this type
          summary.totalSpent += t.amount;

          // Incoming to other type
          if (toType) {
            if (!summaryMap.has(toType)) {
              summaryMap.set(toType, { type: toType, totalEarned: 0, totalSpent: 0, totalBalance: 0 });
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

      acc.user_ids.forEach(uid => {
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

    return sortedPeriods.map(period => {
      const pStart = toDateTime(period.start_date);
      const pEnd = toDateTime(period.end_date ?? new Date()); // Default to now if active
      if (!pStart || !pEnd) return null;

      // Filter transactions for this period AND this user
      const pTransactions = transactions.filter(t => {
        // STRICT USER ISOLATION: Only count transactions for this period's user
        if (t.user_id !== period.user_id) return false;

        const date = toDateTime(t.date);
        return date && date >= pStart && date <= pEnd;
      });

      // Metrics
      let totalEarned = 0;
      let totalSpent = 0;

      // Account Type Metrics
      const metricsByAccountType: Record<string, { earned: number; spent: number; startBalance: number; endBalance: number }> = {};
      const accountMap = new Map(accounts.map(a => [a.id, a]));

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
        }
        else if (t.type === 'transfer' && t.to_account_id) {
          const toAccount = accountMap.get(t.to_account_id);
          const toType = toAccount ? this.normalizeAccountType(toAccount.type) : null;

          if (type !== toType) {
            metricsByAccountType[type].spent += t.amount;
            totalSpent += t.amount;

            if (toType) {
              if (!metricsByAccountType[toType]) {
                metricsByAccountType[toType] = { earned: 0, spent: 0, startBalance: 0, endBalance: 0 };
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
      Object.keys(metricsByAccountType).forEach(type => {
        if (!userBalances.has(type)) {
          userBalances.set(type, 0); // Assume 0 if not present in accounts (shouldn't happen if account exists)
        }
      });

      // Process each type involved in flows OR holding a balance
      // We need to iterate ALL types that have a balance, not just those with activity
      const allTypes = new Set([...Object.keys(metricsByAccountType), ...userBalances.keys()]);

      allTypes.forEach(type => {
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
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      totalSpent = pTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        id: period.id,
        name: `${formatDateShort(period.start_date)} - ${period.end_date ? formatDateShort(period.end_date) : 'Present'}`,
        startDate: period.start_date as string,
        endDate: (period.end_date || new Date().toISOString().split('T')[0]) as string,
        startBalance: 0, // Not implemented globally yet
        endBalance: 0,   // Not implemented globally yet
        totalEarned,
        totalSpent,
        metricsByAccountType,
        userId: period.user_id
      };
    }).filter(Boolean) as ReportPeriodSummary[];
  }

  /**
   * Calculate Category Statistics
   */
  static calculateCategoryStats(
    transactions: Transaction[],
    categories: Category[]
  ): { income: CategoryStat[], expense: CategoryStat[] } {
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    const statsMap = new Map<string, CategoryStat>();

    for (const t of transactions) {
      if (t.type === 'transfer') continue; // Skip transfers for category stats

      const catId = t.category;
      let catKey = catId;
      const category = categoryMap.get(catId) || Array.from(categoryMap.values()).find(c => c.key.toLowerCase() === catId.toLowerCase());
      if (category) catKey = category.id;

      if (!statsMap.has(catKey)) {
        statsMap.set(catKey, {
          id: catKey,
          name: category?.label || catId,
          type: t.type as 'income' | 'expense',
          total: 0,
          color: category?.color || '#cbd5e1'
        });
      }

      const stat = statsMap.get(catKey)!;
      stat.total += t.amount;
    }

    const allStats = Array.from(statsMap.values());
    const income = allStats.filter(s => s.type === 'income').sort((a, b) => b.total - a.total);
    const expense = allStats.filter(s => s.type === 'expense').sort((a, b) => b.total - a.total);

    return { income, expense };
  }
}
