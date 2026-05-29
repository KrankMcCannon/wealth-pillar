'use client';

import { use, useCallback, useMemo, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { AppPage, HomeDashboardMain } from '@/components/layout';
import type { ReportsPageData, ReportsScope } from '@/server/use-cases/pages/reports-page.use-case';
import type { User } from '@/lib/types';
import { stitchReports } from '@/styles/home-design-foundation';
import UserSelector from '@/components/shared/user-selector';
import { ReportsTimeFilter } from '@/features/reports/components/reports-time-filter';
import { ReportsHero } from '@/features/reports/components/reports-hero';
import { TopExpensesRanking } from '@/features/reports/components/top-expenses-ranking';
import { AccountBreakdownSection } from '@/features/reports/components/account-breakdown-section';
import { BudgetPeriodSection } from '@/features/reports/components/budget-period-section';
import type { ReportsTimePreset } from '@/features/reports/utils/reporting-window';

interface ReportsContentProps {
  currentUser: User;
  groupUsers: User[];
  reportsBundlePromise: Promise<ReportsPageData>;
  initialPreset: ReportsTimePreset;
  initialCustomStart?: string | undefined;
  initialCustomEnd?: string | undefined;
  initialScope?: ReportsScope | undefined;
}

function buildReportsSearchParams(
  preset: ReportsTimePreset,
  customRange: { start: string; end: string } | null,
  scope: ReportsScope
): string {
  const params = new URLSearchParams();
  params.set('preset', preset);
  if (preset === 'custom' && customRange) {
    params.set('customStart', customRange.start);
    params.set('customEnd', customRange.end);
  }
  if (scope !== 'all') {
    params.set('member', scope);
  }
  return params.toString();
}

export default function ReportsContent({
  currentUser,
  groupUsers,
  reportsBundlePromise,
  initialPreset,
  initialCustomStart,
  initialCustomEnd,
  initialScope,
}: ReportsContentProps) {
  const data = use(reportsBundlePromise);
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const t = useTranslations('ReportsContent');
  const tHero = useTranslations('Reports.Hero');

  const [preset, setPreset] = useState<ReportsTimePreset>(initialPreset);
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | null>(
    initialCustomStart && initialCustomEnd
      ? { start: initialCustomStart, end: initialCustomEnd }
      : null
  );
  const [selectedScope, setSelectedScope] = useState<ReportsScope>(
    initialScope ?? data.defaultScope
  );

  const syncScopeToUrl = useCallback(
    (scope: ReportsScope) => {
      const query = buildReportsSearchParams(preset, customRange, scope);
      const url = query ? `${pathname}?${query}` : pathname;
      window.history.replaceState(null, '', url);
    },
    [pathname, preset, customRange]
  );

  const pushTimeParams = useCallback(
    (next: { preset?: ReportsTimePreset; customStart?: string; customEnd?: string }) => {
      const nextPreset = next.preset ?? preset;
      const nextCustom =
        next.customStart && next.customEnd
          ? { start: next.customStart, end: next.customEnd }
          : nextPreset === 'custom'
            ? customRange
            : null;
      const query = buildReportsSearchParams(nextPreset, nextCustom, selectedScope);
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [pathname, preset, customRange, selectedScope, router]
  );

  const handlePresetChange = useCallback(
    (p: ReportsTimePreset) => {
      setPreset(p);
      if (p !== 'custom') {
        setCustomRange(null);
        pushTimeParams({ preset: p });
      }
    },
    [pushTimeParams]
  );

  const handleScopeChange = useCallback(
    (scope: string) => {
      const next: ReportsScope = scope === 'all' ? 'all' : scope;
      setSelectedScope(next);
      syncScopeToUrl(next);
    },
    [syncScopeToUrl]
  );

  const comparisonLabel = tHero(data.comparisonLabelKey);

  const section =
    selectedScope === 'all'
      ? data.sections.all
      : (data.sections[selectedScope] ?? data.sections.all);

  const scopedPeriods = useMemo(() => {
    if (selectedScope === 'all') return data.periods;
    return data.periods.filter((p) => p.userId === selectedScope);
  }, [data.periods, selectedScope]);

  const userSelectorValue = selectedScope === 'all' ? 'all' : selectedScope;

  return (
    <AppPage
      currentUser={currentUser}
      title={t('headerTitle')}
      showBack
      skipToMainHref="#main-reports"
      skipToMainLabel={t('skipToMain')}
      betweenHeaderAndMain={
        <div className="flex min-h-0 w-full flex-col">
          <ReportsTimeFilter
            value={preset}
            onChange={handlePresetChange}
            customRange={customRange}
            onCustomApply={(start, end) => {
              setCustomRange({ start, end });
              pushTimeParams({ preset: 'custom', customStart: start, customEnd: end });
            }}
          />

          <HomeDashboardMain
            id="main-reports"
            {...(isPending ? { className: 'opacity-70 transition-opacity' } : {})}
          >
            <div className={stitchReports.sectionStack}>
              <UserSelector
                hideTitle
                currentUser={currentUser}
                users={groupUsers}
                value={userSelectorValue}
                onChange={handleScopeChange}
                showAllOption
              />

              <ReportsHero
                netFlow={section.netFlow}
                income={section.income}
                expenses={section.expenses}
                totalSpendable={section.totalSpendable}
                totalReserve={section.totalReserve}
                netSavings={section.netSavings}
                comparisonPercent={section.comparisonPercent}
                comparisonLabel={comparisonLabel}
              />

              <TopExpensesRanking items={section.topExpenses} />

              <AccountBreakdownSection
                rows={section.accountBreakdown}
                totalWealth={section.totalWealth}
              />

              <BudgetPeriodSection periods={scopedPeriods} />
            </div>
          </HomeDashboardMain>
        </div>
      }
    />
  );
}
