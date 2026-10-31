'use client';

import { use, useCallback, useMemo, useOptimistic, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { useRouter, usePathname } from '@/i18n/routing';
import { HomeDashboardMain } from '@/components/layout';
import { usePageHeader } from '@/hooks/use-page-header';
import type { ReportsPageData, ReportsScope } from '@/server/use-cases/pages/reports-page.use-case';
import type { User } from '@/lib/types';
import { stitchHome, stitchReports } from '@/styles/home-design-foundation';
import { pathWithoutReturnTo, withReturnTo } from '@/lib/navigation/return-to';
import UserSelector from '@/components/shared/user-selector';
import { ReportsTimeFilter } from '@/features/reports/components/reports-time-filter';
import { ReportsHero } from '@/features/reports/components/reports-hero';
import { ReserveSection } from '@/features/reports/components/reserve-section';
import { TopExpensesRanking } from '@/features/reports/components/top-expenses-ranking';
import { AccountBreakdownSection } from '@/features/reports/components/account-breakdown-section';
import { ReportPeriodsDetails } from '@/features/reports/components/report-periods-details';
import {
  buildReportsCategoryTransactionsHref,
  buildReportsPeriodHref,
  buildReportsReserveTransactionsHref,
  buildReportsSearchQuery,
} from '@/features/reports/utils/reports-transactions-href';
import type {
  ReportsDateRange,
  ReportsTimePreset,
} from '@/features/reports/utils/reporting-window';

interface ReportsContentProps {
  currentUser: User;
  groupUsers: User[];
  reportsBundlePromise: Promise<ReportsPageData>;
  initialPreset: ReportsTimePreset;
  initialCustomStart?: string | undefined;
  initialCustomEnd?: string | undefined;
  initialScope?: ReportsScope | undefined;
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
  const formatter = useFormatter();
  const formatRange = (range: ReportsDateRange) =>
    formatter.dateTimeRange(
      new Date(`${range.start}T12:00:00`),
      new Date(`${range.end}T12:00:00`),
      { day: 'numeric', month: 'short', year: 'numeric' }
    );

  const preset = initialPreset;
  const customRange = useMemo(
    () =>
      initialCustomStart && initialCustomEnd
        ? { start: initialCustomStart, end: initialCustomEnd }
        : null,
    [initialCustomStart, initialCustomEnd]
  );
  const appliedTime = useMemo(() => ({ preset, customRange }), [preset, customRange]);
  const [requestedTime, setRequestedTime] = useOptimistic(appliedTime);
  const [scopeState, setScopeState] = useState({
    applied: initialScope,
    value: initialScope ?? data.defaultScope,
  });
  if (scopeState.applied !== initialScope)
    setScopeState({ applied: initialScope, value: initialScope ?? data.defaultScope });
  const selectedScope = scopeState.value;
  const setSelectedScope = useCallback(
    (value: ReportsScope) => setScopeState({ applied: initialScope, value }),
    [initialScope]
  );
  const searchParams = useSearchParams();
  const [insightsOpen, setInsightsOpen] = useState(searchParams.get('periods') === 'open');

  const syncScopeToUrl = useCallback(
    (scope: ReportsScope) => {
      const query = buildReportsSearchQuery({ preset, customRange, scope });
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
      const query = buildReportsSearchQuery({
        preset: nextPreset,
        customRange: nextCustom,
        scope: selectedScope,
      });
      startTransition(() => {
        setRequestedTime({ preset: nextPreset, customRange: nextCustom });
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, preset, customRange, selectedScope, router, setRequestedTime]
  );

  const handlePresetChange = useCallback(
    (p: ReportsTimePreset) => {
      if (p !== 'custom') {
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
    [syncScopeToUrl, setSelectedScope]
  );

  const comparisonLabel = tHero(data.comparisonLabelKey);

  const section =
    selectedScope === 'all'
      ? data.sections.all
      : (data.sections[selectedScope] ?? data.sections.all);

  const userSelectorValue = selectedScope === 'all' ? 'all' : selectedScope;
  const here = pathWithoutReturnTo(
    '/reports',
    buildReportsSearchQuery({ preset, customRange, scope: selectedScope })
  );

  usePageHeader({
    title: t('headerTitle'),
  });

  return (
    <div className="flex min-h-0 w-full flex-col">
      <ReportsTimeFilter
        value={requestedTime.preset}
        onChange={handlePresetChange}
        customRange={requestedTime.customRange}
        onCustomApply={(start, end) => {
          pushTimeParams({ preset: 'custom', customStart: start, customEnd: end });
        }}
      >
        <fieldset disabled={isPending} aria-label={t('scopeLabel')}>
          <UserSelector
            hideTitle
            currentUser={currentUser}
            users={groupUsers}
            value={userSelectorValue}
            onChange={handleScopeChange}
            showAllOption
          />
        </fieldset>
      </ReportsTimeFilter>

      <div
        className="px-4 py-2 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span>
          {isPending ? t('updating') : t('periodLabel', { range: formatRange(data.currentWindow) })}
        </span>
        {isPending ? (
          <span className="mt-1 block">
            {t('previousData', { range: formatRange(data.currentWindow) })}
          </span>
        ) : data.comparisonWindow ? (
          <span className="mt-1 block">
            {t('comparisonRange', { range: formatRange(data.comparisonWindow) })}
          </span>
        ) : null}
      </div>
      <HomeDashboardMain id="main-reports" ariaBusy={isPending} className="pt-2">
        <div className={stitchReports.sectionStack}>
          {data.transactionsTruncated ? (
            <p className={stitchReports.incompleteNotice} role="status">
              {t('incompleteData')}
            </p>
          ) : null}

          <ReportsHero
            netFlow={section.netFlow}
            income={section.income}
            expenses={section.expenses}
            comparisonPercent={section.comparisonPercent}
            comparisonLabel={comparisonLabel}
          />

          <TopExpensesRanking
            items={section.topExpenses}
            periodExpenses={section.expenses}
            hrefForCategory={(categoryKey) =>
              withReturnTo(
                buildReportsCategoryTransactionsHref({
                  preset,
                  customRange,
                  scope: selectedScope,
                  categoryKey,
                  window: data.currentWindow,
                }),
                here
              )
            }
          />

          <ReserveSection
            savings={section.netSavings}
            movementsHref={withReturnTo(
              buildReportsReserveTransactionsHref({
                preset,
                customRange,
                scope: selectedScope,
                window: data.currentWindow,
              }),
              here
            )}
          />

          <details
            id="budget-periods"
            className={stitchHome.scanSection}
            open={insightsOpen}
            onToggle={(event) => setInsightsOpen(event.currentTarget.open)}
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
              <span className="min-w-0">
                <span className={stitchHome.scanSectionTitle}>{t('insightsTitle')}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                  {t('insightsDescription')}
                </span>
              </span>
              <ChevronDown
                className={`size-4 shrink-0 transition-transform ${
                  insightsOpen ? 'rotate-180' : ''
                }`}
                aria-hidden
              />
            </summary>

            {insightsOpen ? (
              <div className="mt-4 flex flex-col gap-5">
                <AccountBreakdownSection
                  rows={section.accountBreakdown}
                  totalWealth={section.totalWealth}
                />

                <ReportPeriodsDetails
                  key={`${data.currentWindow.start}:${data.currentWindow.end}`}
                  window={data.currentWindow}
                  scope={selectedScope}
                  users={groupUsers}
                  viewerId={currentUser.id}
                  hrefForPeriod={(period) =>
                    buildReportsPeriodHref({
                      periodId: period.id,
                      preset,
                      customRange,
                      scope: selectedScope,
                    })
                  }
                />
              </div>
            ) : null}
          </details>
        </div>
      </HomeDashboardMain>
    </div>
  );
}
