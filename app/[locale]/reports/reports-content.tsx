'use client';

import { use, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AppPage, HomeDashboardMain } from '@/components/layout';
import { Button } from '@/components/ui';
import type { ReportsPageData } from '@/server/use-cases/pages/reports-page.use-case';
import type { User } from '@/lib/types';
import { stitchReports } from '@/styles/home-design-foundation';
import UserSelector from '@/components/shared/user-selector';
import { ReportsTimeFilter } from '@/features/reports/components/reports-time-filter';
import { ReportsHero } from '@/features/reports/components/reports-hero';
import { TopExpensesRanking } from '@/features/reports/components/top-expenses-ranking';
import { AccountBreakdownSection } from '@/features/reports/components/account-breakdown-section';
import { HistoricalBudgetSection } from '@/features/reports/components/historical-budget-section';
import {
  computeCategoryStats,
  computeUserFlows,
  flowsToAccountTypeSummary,
  netFlowDeltaPercent,
  periodOverlapsWindow,
  sumIncomeExpenseInWindow,
  type SerializedAccount,
  type SerializedCategory,
  type SerializedTransaction,
} from '@/features/reports/utils/aggregations';
import {
  getComparisonReportingWindow,
  getCurrentReportingWindow,
  type ReportsTimePreset,
} from '@/features/reports/utils/reporting-window';

interface ReportsContentProps {
  currentUser: User;
  groupUsers: User[];
  reportsBundlePromise: Promise<ReportsPageData>;
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

  return (
    <AppPage
      currentUser={currentUser}
      title={t('headerTitle')}
      showBack
      showActions
      skipToMainHref="#main-reports"
      skipToMainLabel={t('skipToMain')}
      betweenHeaderAndMain={
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

            <div className="mt-6 border-t border-border/25 pt-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <h2 className={stitchReports.sectionTitle}>{t('sectionMemberTitle')}</h2>
                  <p className="text-sm leading-snug text-muted-foreground">
                    {t('sectionMemberSubtitle')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-border/40 bg-muted/50 text-foreground hover:bg-accent"
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
      }
    />
  );
}
