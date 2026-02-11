'use client';

import { useMemo, useState } from 'react';
import { BottomNavigation, PageContainer, Header } from '@/components/layout';
import { SummarySection, PeriodsSection } from '@/features/reports';
import { TimeTrendsChart } from '@/features/reports/components/TimeTrendsChart';
import { CategoryDistribution } from '@/features/reports/components/CategoryDistribution';
import { BudgetFlowVisualizer } from '@/features/reports/components/BudgetFlowVisualizer';
import {
  TimeRangeSelector,
  getTimeRangeStartDate,
  type TimeRange,
} from '@/features/reports/components/TimeRangeSelector';
import { useTranslations } from 'next-intl';
import type {
  AccountTypeSummary,
  ReportPeriodSummary,
  UserFlowSummary,
  UserAccountFlow,
} from '@/server/services/reports.service';
import type { User } from '@/lib/types';
import { reportsStyles } from '@/features/reports/theme/reports-styles';
import { motion } from 'framer-motion';
import { User as UserIcon } from 'lucide-react';

interface SerializedTransaction {
  amount: number;
  type: string;
  category: string;
  date: string;
  user_id: string | null;
  account_id: string;
  to_account_id: string | null;
}

interface SerializedCategory {
  id: string;
  label: string;
  key: string;
  color: string;
}

interface SerializedAccount {
  id: string;
  type: string;
  balance: number;
  user_ids: string[];
}

interface ReportsContentProps {
  accountTypeSummary: AccountTypeSummary[];
  periodSummaries: ReportPeriodSummary[];
  spendingTrends: { date: string; income: number; expense: number }[];
  currentUser: User;
  groupUsers: User[];
  transactions: SerializedTransaction[];
  categories: SerializedCategory[];
  accounts: SerializedAccount[];
}

function normalizeAccountType(type: string): string {
  if (!type) return 'other';
  const lower = type.toLowerCase();
  if (lower === 'investment' || lower === 'investments') return 'investments';
  return lower;
}

/**
 * Client-side category stats computation.
 */
function computeCategoryStats(
  transactions: SerializedTransaction[],
  categories: SerializedCategory[],
  startDate: Date | null
) {
  const filtered = startDate
    ? transactions.filter((t) => new Date(t.date).getTime() >= startDate.getTime())
    : transactions;

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const statsMap = new Map<
    string,
    { id: string; name: string; type: string; total: number; color: string }
  >();

  for (const t of filtered) {
    if (t.type === 'transfer') continue;

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
        type: t.type,
        total: 0,
        color: category?.color || '#cbd5e1',
      });
    }

    statsMap.get(catKey)!.total += t.amount;
  }

  const allStats = Array.from(statsMap.values());
  return allStats.filter((s) => s.type === 'expense').sort((a, b) => b.total - a.total);
}

/**
 * Client-side per-user flow computation with optional date filtering.
 * Correctly handles transfers between accounts.
 */
function computeUserFlows(
  transactions: SerializedTransaction[],
  accounts: SerializedAccount[],
  userIds: string[],
  startDate: Date | null
): UserFlowSummary[] {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  // Filter transactions by date if needed
  const filtered = startDate
    ? transactions.filter((t) => new Date(t.date).getTime() >= startDate.getTime())
    : transactions;

  // Initialize per-user, per-account-type buckets
  const userFlows = new Map<
    string,
    Map<string, { earned: number; spent: number; balance: number }>
  >();

  for (const uid of userIds) {
    userFlows.set(uid, new Map());
  }

  // Seed with current account balances
  for (const account of accounts) {
    const type = normalizeAccountType(account.type);
    for (const uid of account.user_ids) {
      if (!userFlows.has(uid)) continue;
      const typeMap = userFlows.get(uid)!;
      if (!typeMap.has(type)) {
        typeMap.set(type, { earned: 0, spent: 0, balance: 0 });
      }
      typeMap.get(type)!.balance += account.balance;
    }
  }

  // Aggregate flows
  for (const t of filtered) {
    const uid = t.user_id;
    if (!uid || !userFlows.has(uid)) continue;

    const account = accountMap.get(t.account_id);
    if (!account) continue;

    const type = normalizeAccountType(account.type);
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
      const toType = normalizeAccountType(toAccount.type);
      ensureBucket(typeMap, type).spent += t.amount;
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

export default function ReportsContent({
  accountTypeSummary,
  periodSummaries,
  spendingTrends,
  currentUser,
  groupUsers,
  transactions,
  categories,
  accounts,
}: ReportsContentProps) {
  const t = useTranslations('ReportsContent');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);

  const isFiltered = timeRange !== 'all';
  const rangeStartDate = useMemo(() => getTimeRangeStartDate(timeRange), [timeRange]);

  // Filter periods by selected time range
  const filteredPeriods = useMemo(() => {
    if (!rangeStartDate) return periodSummaries;
    const startTime = rangeStartDate.getTime();
    return periodSummaries.filter((period) => {
      if (period.startDate) {
        return new Date(period.startDate).getTime() >= startTime;
      }
      return true;
    });
  }, [rangeStartDate, periodSummaries]);

  // Filter spending trends by time range
  const filteredTrends = useMemo(() => {
    if (!rangeStartDate) return spendingTrends;
    return spendingTrends.filter((item) => {
      const itemDate = new Date(item.date);
      return !isNaN(itemDate.getTime()) && itemDate.getTime() >= rangeStartDate.getTime();
    });
  }, [rangeStartDate, spendingTrends]);

  // Compute category stats filtered by time range
  const expenseStats = useMemo(() => {
    return computeCategoryStats(transactions, categories, rangeStartDate);
  }, [transactions, categories, rangeStartDate]);

  // Compute user flow summaries filtered by time range
  const userFlowSummaries = useMemo(() => {
    const userIds = groupUsers.map((u) => u.id);
    return computeUserFlows(transactions, accounts, userIds, rangeStartDate);
  }, [transactions, accounts, groupUsers, rangeStartDate]);

  // Compute summary income/expenses from transactions for the current user
  const filteredSummaryTotals = useMemo(() => {
    if (!isFiltered) return { income: null, expenses: null };

    const filtered = rangeStartDate
      ? transactions.filter(
          (t) =>
            t.user_id === currentUser.id && new Date(t.date).getTime() >= rangeStartDate.getTime()
        )
      : transactions.filter((t) => t.user_id === currentUser.id);

    let income = 0;
    let expenses = 0;
    for (const t of filtered) {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expenses += t.amount;
    }
    return { income, expenses };
  }, [transactions, currentUser.id, rangeStartDate, isFiltered]);

  // Filter flow and periods by selected user
  const selectedUserFlow = useMemo(() => {
    return userFlowSummaries.find((f) => f.userId === selectedUserId);
  }, [userFlowSummaries, selectedUserId]);

  const selectedUserPeriods = useMemo(() => {
    return filteredPeriods.filter((p) => p.userId === selectedUserId);
  }, [filteredPeriods, selectedUserId]);

  const totalExpenses = expenseStats.reduce((sum, stat) => sum + stat.total, 0);
  const showUserSelector = groupUsers.length > 1;

  return (
    <div
      className={reportsStyles.page.container}
      style={reportsStyles.page.style as React.CSSProperties}
    >
      <div className={reportsStyles.page.gradientBg}></div>
      <PageContainer>
        <Header
          title={t('headerTitle')}
          showBack={true}
          currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
          showActions={true}
        />

        <div className={reportsStyles.main.container}>
          {/* Time Range Selector */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </motion.div>

          {/* Summary Section — time-range aware */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SummarySection
              accounts={accountTypeSummary}
              filteredIncome={filteredSummaryTotals.income}
              filteredExpenses={filteredSummaryTotals.expenses}
              isFiltered={isFiltered}
            />
          </motion.div>

          {/* Charts Grid */}
          <div className={reportsStyles.main.dashboardGrid}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="col-span-1 md:col-span-8"
            >
              <TimeTrendsChart data={filteredTrends} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="col-span-1 md:col-span-4"
            >
              <CategoryDistribution
                data={expenseStats.map((s) => ({ ...s, value: s.total }))}
                total={totalExpenses}
              />
            </motion.div>
          </div>

          {/* User Selector (only show when multiple users) */}
          {showUserSelector && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="mt-6 mb-4"
            >
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/2 border border-white/5">
                <UserIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
                  {groupUsers.map((user) => {
                    const isActive = user.id === selectedUserId;
                    return (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        {user.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Filtered Content Grid */}
          <div className={reportsStyles.main.dashboardGrid}>
            {selectedUserFlow && (
              <motion.div
                key={selectedUserId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="col-span-1 md:col-span-12"
              >
                <BudgetFlowVisualizer userFlow={selectedUserFlow} />
              </motion.div>
            )}

            {/* Periods List — filtered by selected user */}
            <motion.div
              key={`periods-${selectedUserId}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="col-span-1 md:col-span-12"
            >
              <PeriodsSection data={selectedUserPeriods} users={groupUsers} />
            </motion.div>
          </div>
        </div>

        <BottomNavigation />
      </PageContainer>
    </div>
  );
}
