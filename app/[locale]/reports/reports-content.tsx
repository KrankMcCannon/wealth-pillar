'use client';

import dynamic from 'next/dynamic';
import { use, useMemo, useState } from 'react';
import { BottomNavigation, PageContainer, Header } from '@/components/layout';
import { SummarySection, PeriodsSection } from '@/features/reports';
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
import { reportsStyles } from '@/styles/system';
import UserSelector from '@/components/shared/user-selector';

const TimeTrendsChart = dynamic(
  () => import('@/features/reports/components/TimeTrendsChart').then((m) => m.TimeTrendsChart),
  { loading: () => <div className="h-48 animate-pulse rounded-xl bg-primary/10" /> }
);

const CategoryDistribution = dynamic(
  () =>
    import('@/features/reports/components/CategoryDistribution').then(
      (m) => m.CategoryDistribution
    ),
  { loading: () => <div className="h-64 animate-pulse rounded-xl bg-primary/10" /> }
);

const BudgetFlowVisualizer = dynamic(
  () =>
    import('@/features/reports/components/BudgetFlowVisualizer').then(
      (m) => m.BudgetFlowVisualizer
    ),
  { loading: () => <div className="h-56 animate-pulse rounded-xl bg-primary/10" /> }
);

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
  currentUser: User;
  groupUsers: User[];
  reportsBundlePromise: Promise<{
    accountTypeSummary: AccountTypeSummary[];
    periodSummaries: ReportPeriodSummary[];
    spendingTrends: { date: string; income: number; expense: number }[];
    transactions: SerializedTransaction[];
    categories: SerializedCategory[];
    accounts: SerializedAccount[];
  }>;
}

function formatCategoryFallback(catId: string): string {
  return catId
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeAccountType(type: string): string {
  if (!type) return 'other';
  const lower = type.toLowerCase();
  if (lower === 'investment' || lower === 'investments') return 'investments';
  return lower;
}

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
        name: category?.label || formatCategoryFallback(catId),
        type: t.type,
        total: 0,
        color: category?.color || 'oklch(var(--color-muted-foreground))',
      });
    }

    statsMap.get(catKey)!.total += t.amount;
  }

  const allStats = Array.from(statsMap.values());
  return allStats.filter((s) => s.type === 'expense').sort((a, b) => b.total - a.total);
}

function computeUserFlows(
  transactions: SerializedTransaction[],
  accounts: SerializedAccount[],
  userIds: string[],
  startDate: Date | null
): UserFlowSummary[] {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const filtered = startDate
    ? transactions.filter((t) => new Date(t.date).getTime() >= startDate.getTime())
    : transactions;

  const userFlows = new Map<
    string,
    Map<string, { earned: number; spent: number; balance: number }>
  >();

  for (const uid of userIds) {
    userFlows.set(uid, new Map());
  }

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
  currentUser,
  groupUsers,
  reportsBundlePromise,
}: ReportsContentProps) {
  const {
    accountTypeSummary,
    periodSummaries,
    spendingTrends,
    transactions,
    categories,
    accounts,
  } = use(reportsBundlePromise);

  const t = useTranslations('ReportsContent');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);

  const isFiltered = timeRange !== 'all';
  const rangeStartDate = useMemo(() => getTimeRangeStartDate(timeRange), [timeRange]);

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

  const filteredTrends = useMemo(() => {
    if (!rangeStartDate) return spendingTrends;
    return spendingTrends.filter((item) => {
      const itemDate = new Date(item.date);
      return !isNaN(itemDate.getTime()) && itemDate.getTime() >= rangeStartDate.getTime();
    });
  }, [rangeStartDate, spendingTrends]);

  const expenseStats = useMemo(() => {
    return computeCategoryStats(transactions, categories, rangeStartDate);
  }, [transactions, categories, rangeStartDate]);

  const userFlowSummaries = useMemo(() => {
    const userIds = groupUsers.map((u) => u.id);
    return computeUserFlows(transactions, accounts, userIds, rangeStartDate);
  }, [transactions, accounts, groupUsers, rangeStartDate]);

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

  const selectedUserFlow = useMemo(() => {
    return userFlowSummaries.find((f) => f.userId === selectedUserId);
  }, [userFlowSummaries, selectedUserId]);

  const selectedUserPeriods = useMemo(() => {
    return filteredPeriods.filter((p) => p.userId === selectedUserId);
  }, [filteredPeriods, selectedUserId]);

  const totalExpenses = expenseStats.reduce((sum, stat) => sum + stat.total, 0);

  return (
    <PageContainer>
      <Header
        title={t('headerTitle')}
        showBack
        currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
        showActions
      />

      <main className={reportsStyles.main.container}>
        {/* Time Range Selector */}
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

        {/* Summary Section */}
        <SummarySection
          accounts={accountTypeSummary}
          filteredIncome={filteredSummaryTotals.income}
          filteredExpenses={filteredSummaryTotals.expenses}
          isFiltered={isFiltered}
        />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <section className="col-span-1 md:col-span-8" aria-label={t('sectionTimeTrendsAriaLabel')}>
            <TimeTrendsChart data={filteredTrends} />
          </section>

          <section className="col-span-1 md:col-span-4" aria-label={t('sectionCategoriesAriaLabel')}>
            <CategoryDistribution
              data={expenseStats.map((s) => ({ ...s, value: s.total }))}
              total={totalExpenses}
            />
          </section>
        </div>

        {/* User Selector — solo con più utenti nel gruppo */}
        <UserSelector
          currentUser={currentUser}
          users={groupUsers}
          value={selectedUserId}
          onChange={setSelectedUserId}
          showAllOption={false}
        />

        {/* Dati per utente selezionato */}
        <div className="space-y-4">
          {selectedUserFlow && (
            <section aria-label={t('sectionBudgetFlowAriaLabel')}>
              <BudgetFlowVisualizer userFlow={selectedUserFlow} />
            </section>
          )}

          <section aria-label={t('sectionPeriodsAriaLabel')}>
            <PeriodsSection data={selectedUserPeriods} users={groupUsers} />
          </section>
        </div>
      </main>

      <BottomNavigation />
    </PageContainer>
  );
}
