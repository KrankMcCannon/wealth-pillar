'use client';

import { use, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BottomNavigation,
  PageContainer,
  Header,
  HomeDashboardMain,
  SkipToMainLink,
} from '@/components/layout';
import { Button } from '@/components/ui';
import type { ReportsPageData } from '@/server/use-cases/pages/reports-page.use-case';
import type {
  AccountTypeSummary,
  ReportPeriodSummary,
  UserAccountFlow,
  UserFlowSummary,
} from '@/server/use-cases/reports/reports.use-cases';
import type { Account, Category, Transaction, User } from '@/lib/types';
import { stitchReports } from '@/styles/home-design-foundation';
import UserSelector from '@/components/shared/user-selector';
import { ReportsTimeFilter } from '@/features/reports/components/ReportsTimeFilter';
import { ReportsHero } from '@/features/reports/components/ReportsHero';
import { TopExpensesRanking } from '@/features/reports/components/TopExpensesRanking';
import { AccountBreakdownSection } from '@/features/reports/components/AccountBreakdownSection';
import { HistoricalBudgetSection } from '@/features/reports/components/HistoricalBudgetSection';
import type { DateWindow } from '@/features/reports/utils/reporting-window';
import {
  getComparisonReportingWindow,
  getCurrentReportingWindow,
  type ReportsTimePreset,
} from '@/features/reports/utils/reporting-window';

type SerializedTransaction = Transaction & { date: string };
type SerializedCategory = Category;
type SerializedAccount = Account & { balance: number };

interface ReportsContentProps {
  currentUser: User;
  groupUsers: User[];
  reportsBundlePromise: Promise<ReportsPageData>;
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

function sumIncomeExpenseInWindow(
  transactions: SerializedTransaction[],
  window: DateWindow,
  userId?: string
): { income: number; expenses: number } {
  const t0 = window.start.getTime();
  const t1 = window.end.getTime();
  let income = 0;
  let expenses = 0;
  for (const row of transactions) {
    const d = new Date(row.date).getTime();
    if (d < t0 || d > t1) continue;
    if (userId !== undefined && row.user_id !== userId) continue;
    if (row.type === 'income') income += row.amount;
    else if (row.type === 'expense') expenses += row.amount;
  }
  return { income, expenses };
}

function computeCategoryStats(
  transactions: SerializedTransaction[],
  categories: SerializedCategory[],
  window: DateWindow,
  userId?: string
) {
  const t0 = window.start.getTime();
  const t1 = window.end.getTime();
  const filtered = transactions.filter((row) => {
    const d = new Date(row.date).getTime();
    if (d < t0 || d > t1) return false;
    if (userId !== undefined && row.user_id !== userId) return false;
    return true;
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const statsMap = new Map<
    string,
    { id: string; name: string; type: string; total: number; color: string }
  >();

  for (const tx of filtered) {
    if (tx.type === 'transfer') continue;

    const catId = tx.category;
    let catKey = catId;
    const category =
      categoryMap.get(catId) ||
      Array.from(categoryMap.values()).find((c) => c.key.toLowerCase() === catId.toLowerCase());
    if (category) catKey = category.id;

    if (!statsMap.has(catKey)) {
      statsMap.set(catKey, {
        id: catKey,
        name: category?.label || formatCategoryFallback(catId),
        type: tx.type,
        total: 0,
        color: category?.color || 'oklch(var(--color-muted-foreground))',
      });
    }

    statsMap.get(catKey)!.total += tx.amount;
  }

  const allStats = Array.from(statsMap.values());
  return allStats.filter((s) => s.type === 'expense').sort((a, b) => b.total - a.total);
}

function computeUserFlows(
  transactions: SerializedTransaction[],
  accounts: SerializedAccount[],
  userIds: string[],
  window: DateWindow
): UserFlowSummary[] {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const t0 = window.start.getTime();
  const t1 = window.end.getTime();
  const filtered = transactions.filter((row) => {
    const d = new Date(row.date).getTime();
    return d >= t0 && d <= t1;
  });

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

  for (const tx of filtered) {
    const uid = tx.user_id;
    if (!uid || !userFlows.has(uid)) continue;

    const account = accountMap.get(tx.account_id);
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

    if (tx.type === 'income') {
      ensureBucket(typeMap, type).earned += tx.amount;
    } else if (tx.type === 'expense') {
      ensureBucket(typeMap, type).spent += tx.amount;
    } else if (tx.type === 'transfer' && tx.to_account_id) {
      const toAccount = accountMap.get(tx.to_account_id);
      if (!toAccount) continue;
      const toType = normalizeAccountType(toAccount.type);
      ensureBucket(typeMap, type).spent += tx.amount;
      ensureBucket(typeMap, toType).earned += tx.amount;
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

function periodOverlapsWindow(period: ReportPeriodSummary, w: DateWindow): boolean {
  const ps = new Date(period.startDate).getTime();
  const pe = new Date(period.endDate).getTime();
  const ws = w.start.getTime();
  const we = w.end.getTime();
  return !(pe < ws || ps > we);
}

function flowsToAccountTypeSummary(flows: UserAccountFlow[]): AccountTypeSummary[] {
  return flows.map((f) => ({
    accountType: f.accountType,
    totalBalance: f.balance,
    totalEarned: f.earned,
    totalSpent: f.spent,
    transactionCount: 0,
  }));
}

function netFlowDeltaPercent(currentNet: number, previousNet: number): number | null {
  if (previousNet === 0 && currentNet === 0) return null;
  if (previousNet === 0) return currentNet > 0 ? 100 : -100;
  return ((currentNet - previousNet) / Math.abs(previousNet)) * 100;
}

export default function ReportsContent({
  currentUser,
  groupUsers,
  reportsBundlePromise,
}: ReportsContentProps) {
  const { accountTypeSummary, periodSummaries, transactions, categories, accounts } = use(
    reportsBundlePromise
  ) as unknown as ReportsPageData & {
    transactions: SerializedTransaction[];
    categories: SerializedCategory[];
    accounts: SerializedAccount[];
  };

  const t = useTranslations('ReportsContent');
  const tHero = useTranslations('Reports.Hero');
  const [preset, setPreset] = useState<ReportsTimePreset>('monthly');
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(null);
  const [memberOpen, setMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);

  const handlePresetChange = useCallback((p: ReportsTimePreset) => {
    setPreset(p);
    if (p !== 'custom') setCustomRange(null);
  }, []);

  const currentWindow = useMemo(
    () => getCurrentReportingWindow(preset, customRange),
    [preset, customRange]
  );

  const comparisonWindow = useMemo(
    () => getComparisonReportingWindow(preset, currentWindow),
    [preset, currentWindow]
  );

  const filteredPeriodsAllUsers = useMemo(() => {
    return periodSummaries
      .filter((p) => periodOverlapsWindow(p, currentWindow))
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [periodSummaries, currentWindow]);

  const groupTotals = useMemo(
    () => sumIncomeExpenseInWindow(transactions, currentWindow),
    [transactions, currentWindow]
  );

  const prevTotals = useMemo(() => {
    if (!comparisonWindow) return null;
    return sumIncomeExpenseInWindow(transactions, comparisonWindow);
  }, [transactions, comparisonWindow]);

  const groupNet = groupTotals.income - groupTotals.expenses;
  const prevNet = prevTotals ? prevTotals.income - prevTotals.expenses : null;
  const comparisonPercent = prevNet !== null ? netFlowDeltaPercent(groupNet, prevNet) : null;

  const comparisonLabel =
    preset === 'monthly'
      ? tHero('vsLastMonth')
      : preset === 'weekly'
        ? tHero('vsLastWeek')
        : preset === 'yearly'
          ? tHero('vsLastYear')
          : tHero('vsPreviousRange');

  const expenseStats = useMemo(
    () => computeCategoryStats(transactions, categories, currentWindow),
    [transactions, categories, currentWindow]
  );

  const topThree = useMemo(
    () => expenseStats.slice(0, 3).map((s) => ({ id: s.id, name: s.name, total: s.total })),
    [expenseStats]
  );

  const groupTotalWealth = useMemo(
    () => accountTypeSummary.reduce((s, a) => s + a.totalBalance, 0),
    [accountTypeSummary]
  );

  const userFlowSummaries = useMemo(
    () =>
      computeUserFlows(
        transactions,
        accounts,
        groupUsers.map((u) => u.id),
        currentWindow
      ),
    [transactions, accounts, groupUsers, currentWindow]
  );

  const selectedUserFlow = useMemo(
    () => userFlowSummaries.find((f) => f.userId === selectedUserId),
    [userFlowSummaries, selectedUserId]
  );

  const memberTotals = useMemo(
    () => sumIncomeExpenseInWindow(transactions, currentWindow, selectedUserId),
    [transactions, currentWindow, selectedUserId]
  );

  const memberExpenseStats = useMemo(
    () => computeCategoryStats(transactions, categories, currentWindow, selectedUserId),
    [transactions, categories, currentWindow, selectedUserId]
  );

  const memberTopThree = useMemo(
    () => memberExpenseStats.slice(0, 3).map((s) => ({ id: s.id, name: s.name, total: s.total })),
    [memberExpenseStats]
  );

  const memberAccountRows = useMemo(
    () => (selectedUserFlow ? flowsToAccountTypeSummary(selectedUserFlow.accounts) : []),
    [selectedUserFlow]
  );

  const memberTotalWealth = useMemo(
    () => memberAccountRows.reduce((s, a) => s + a.totalBalance, 0),
    [memberAccountRows]
  );

  const memberPeriods = useMemo(() => {
    return filteredPeriodsAllUsers.filter((p) => p.userId === selectedUserId);
  }, [filteredPeriodsAllUsers, selectedUserId]);

  const headerCurrentUser = useMemo(
    () => ({
      ...(currentUser.name != null ? { name: currentUser.name } : {}),
      role: currentUser.role || 'member',
    }),
    [currentUser.name, currentUser.role]
  );

  return (
    <PageContainer>
      <SkipToMainLink href="#main-reports">{t('skipToMain')}</SkipToMainLink>

      <Header title={t('headerTitle')} showBack currentUser={headerCurrentUser} showActions />

      {/*
        Stessa struttura della pagina Transazioni: `flex min-h-0 flex-col` raggruppa toolbar sticky + main
        così stacking e scroll restano coerenti con il resto del dashboard.
      */}
      <div className="flex min-h-0 w-full flex-col">
        <ReportsTimeFilter
          value={preset}
          onChange={handlePresetChange}
          customRange={customRange}
          onCustomApply={(start, end) => setCustomRange({ start, end })}
        />

        <HomeDashboardMain id="main-reports">
          <div className={stitchReports.sectionStack}>
            <ReportsHero
              netFlow={groupNet}
              income={groupTotals.income}
              expenses={groupTotals.expenses}
              comparisonPercent={comparisonPercent}
              comparisonLabel={comparisonLabel}
            />

            <TopExpensesRanking items={topThree} />

            <AccountBreakdownSection rows={accountTypeSummary} totalWealth={groupTotalWealth} />

            <HistoricalBudgetSection periods={filteredPeriodsAllUsers} />
          </div>

          <div className="mt-6 border-t border-[#3359c5]/25 pt-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <h2 className={stitchReports.sectionTitle}>{t('sectionMemberTitle')}</h2>
                <p className="text-sm leading-snug text-[#9fb0d7]">{t('sectionMemberSubtitle')}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-[#3359c5]/40 bg-[#11295f]/50 text-[#e6ecff] hover:bg-[#17336f]"
                aria-expanded={memberOpen}
                aria-controls="reports-member-panel"
                onClick={() => setMemberOpen((o) => !o)}
              >
                {memberOpen ? t('memberSectionCollapse') : t('memberSectionExpand')}
              </Button>
            </div>

            {memberOpen ? (
              <div id="reports-member-panel" className="mt-4 flex flex-col gap-5">
                <UserSelector
                  hideTitle
                  currentUser={currentUser}
                  users={groupUsers}
                  value={selectedUserId}
                  onChange={setSelectedUserId}
                  showAllOption={false}
                />
                {selectedUserFlow ? (
                  <>
                    <ReportsHero
                      netFlow={memberTotals.income - memberTotals.expenses}
                      income={memberTotals.income}
                      expenses={memberTotals.expenses}
                      omitComparison
                    />
                    <TopExpensesRanking items={memberTopThree} />
                    <AccountBreakdownSection
                      rows={memberAccountRows}
                      totalWealth={memberTotalWealth}
                    />
                    <HistoricalBudgetSection periods={memberPeriods} />
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </HomeDashboardMain>
      </div>

      <BottomNavigation />
    </PageContainer>
  );
}
