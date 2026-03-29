'use client';

import dynamic from 'next/dynamic';
import { use, useMemo, useState } from 'react';
import { BottomNavigation, PageContainer, Header, SectionHeader } from '@/components/layout';
import { PageSection } from '@/components/ui/layout';
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
  { loading: () => <div className="h-[300px] animate-pulse rounded-xl bg-primary/10" /> }
);

const CategoryDistribution = dynamic(
  () =>
    import('@/features/reports/components/CategoryDistribution').then(
      (m) => m.CategoryDistribution
    ),
  { loading: () => <div className="h-[300px] animate-pulse rounded-xl bg-primary/10" /> }
);

const BudgetFlowVisualizer = dynamic(
  () =>
    import('@/features/reports/components/BudgetFlowVisualizer').then(
      (m) => m.BudgetFlowVisualizer
    ),
  { loading: () => <div className="h-[280px] animate-pulse rounded-xl bg-primary/10" /> }
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
  return catId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeAccountType(type: string): string {
  if (!type) return 'other';
  const lower = type.toLowerCase();
  if (lower === 'investment' || lower === 'investments') return 'investments';
  return lower;
}

/** Somma entrate/uscite (no transfer). Senza userId include tutte le transazioni del gruppo. */
function sumIncomeExpenseInRange(
  transactions: SerializedTransaction[],
  startDate: Date | null,
  userId?: string
): { income: number; expenses: number } {
  const filtered = startDate
    ? transactions.filter((row) => new Date(row.date).getTime() >= startDate.getTime())
    : transactions;
  let income = 0;
  let expenses = 0;
  for (const row of filtered) {
    if (userId !== undefined && row.user_id !== userId) continue;
    if (row.type === 'income') income += row.amount;
    else if (row.type === 'expense') expenses += row.amount;
  }
  return { income, expenses };
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

  const groupPeriodTotals = useMemo(() => {
    if (!isFiltered || !rangeStartDate) return null;
    return sumIncomeExpenseInRange(transactions, rangeStartDate);
  }, [transactions, rangeStartDate, isFiltered]);

  const groupTotalBalance = useMemo(
    () => accountTypeSummary.reduce((sum, a) => sum + a.totalBalance, 0),
    [accountTypeSummary]
  );

  const groupIncome = useMemo(() => {
    if (isFiltered && groupPeriodTotals) return groupPeriodTotals.income;
    return accountTypeSummary.reduce((sum, a) => sum + a.totalEarned, 0);
  }, [accountTypeSummary, groupPeriodTotals, isFiltered]);

  const groupExpenses = useMemo(() => {
    if (isFiltered && groupPeriodTotals) return groupPeriodTotals.expenses;
    return accountTypeSummary.reduce((sum, a) => sum + a.totalSpent, 0);
  }, [accountTypeSummary, groupPeriodTotals, isFiltered]);

  const selectedUserFlow = useMemo(() => {
    return userFlowSummaries.find((f) => f.userId === selectedUserId);
  }, [userFlowSummaries, selectedUserId]);

  const selectedUserPeriods = useMemo(() => {
    return filteredPeriods.filter((p) => p.userId === selectedUserId);
  }, [filteredPeriods, selectedUserId]);

  const totalExpenses = expenseStats.reduce((sum, stat) => sum + stat.total, 0);

  const selectedMemberName = useMemo(
    () => groupUsers.find((u) => u.id === selectedUserId)?.name ?? '',
    [groupUsers, selectedUserId]
  );

  const memberTotalBalance = useMemo(() => {
    if (!selectedUserFlow) return 0;
    return selectedUserFlow.accounts.reduce((sum, a) => sum + a.balance, 0);
  }, [selectedUserFlow]);

  return (
    <PageContainer>
      <Header
        title={t('headerTitle')}
        showBack
        currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
        showActions
      />

      <main className={reportsStyles.main.container}>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

        <section
          aria-labelledby="reports-section-group"
          className="mt-5 sm:mt-6 rounded-2xl border border-primary/15 bg-card/90 shadow-sm ring-1 ring-black/4 dark:ring-white/6 p-3 sm:p-4 md:p-5"
        >
          <PageSection className="space-y-3 sm:space-y-4">
            <SectionHeader
              titleId="reports-section-group"
              title={t('sectionGroupTitle')}
              subtitle={t('sectionGroupSubtitle')}
            />
            <SummarySection
              variant="group"
              hasAccounts={accountTypeSummary.length > 0}
              totalBalance={groupTotalBalance}
              totalIncome={groupIncome}
              totalExpenses={groupExpenses}
              isFiltered={isFiltered}
            />
            <div className="space-y-3 pt-2">
              <SectionHeader
                title={t('sectionChartsTitle')}
                subtitle={t('sectionChartsSubtitle')}
              />
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="col-span-1 md:col-span-8 min-w-0">
                  <TimeTrendsChart data={filteredTrends} />
                </div>
                <div className="col-span-1 md:col-span-4 min-w-0">
                  <CategoryDistribution
                    data={expenseStats.map((s) => ({ ...s, value: s.total }))}
                    total={totalExpenses}
                  />
                </div>
              </div>
            </div>
          </PageSection>
        </section>

        <section
          aria-labelledby="reports-section-member"
          className="mt-6 sm:mt-8 rounded-2xl border-2 border-primary/28 bg-primary/4.5 dark:bg-primary/9 shadow-md ring-1 ring-primary/10 p-3 sm:p-4 md:p-5"
        >
          <PageSection className="space-y-3 sm:space-y-4">
            <SectionHeader
              titleId="reports-section-member"
              title={t('sectionMemberTitle')}
              subtitle={t('sectionMemberSubtitle')}
            />
            <UserSelector
              currentUser={currentUser}
              users={groupUsers}
              value={selectedUserId}
              onChange={setSelectedUserId}
              showAllOption={false}
            />
            {selectedUserFlow && (
              <>
                <SummarySection
                  variant="member"
                  hasAccounts
                  totalBalance={memberTotalBalance}
                  totalIncome={selectedUserFlow.totalEarned}
                  totalExpenses={selectedUserFlow.totalSpent}
                  isFiltered={isFiltered}
                  memberName={selectedMemberName}
                />
                <section className="space-y-3" aria-label={t('sectionBudgetFlowAriaLabel')}>
                  <BudgetFlowVisualizer userFlow={selectedUserFlow} />
                </section>
                <div className="space-y-3 pt-2">
                  <SectionHeader title={t('sectionPeriodsAriaLabel')} />
                  <PeriodsSection data={selectedUserPeriods} users={groupUsers} />
                </div>
              </>
            )}
          </PageSection>
        </section>
      </main>

      <BottomNavigation />
    </PageContainer>
  );
}
