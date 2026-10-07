'use client';

import { use, useCallback, useMemo, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
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
import { BudgetPeriodSection } from '@/features/reports/components/budget-period-section';
import {
  buildReportsCategoryTransactionsHref,
  buildReportsPeriodHref,
  buildReportsReserveTransactionsHref,
  buildReportsSearchQuery,
} from '@/features/reports/utils/reports-transactions-href';
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
  const [insightsOpen, setInsightsOpen] = useState(false);

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
        value={preset}
        onChange={handlePresetChange}
        customRange={customRange}
        onCustomApply={(start, end) => {
          setCustomRange({ start, end });
          pushTimeParams({ preset: 'custom', customStart: start, customEnd: end });
        }}
      >
        <UserSelector
          hideTitle
          currentUser={currentUser}
          users={groupUsers}
          value={userSelectorValue}
          onChange={handleScopeChange}
          showAllOption
        />
      </ReportsTimeFilter>

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
              }),
              here
            )}
          />

          <details
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

                <BudgetPeriodSection
                  periods={scopedPeriods}
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
