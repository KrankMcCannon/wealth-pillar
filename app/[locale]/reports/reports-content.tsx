'use client';

import { use, useCallback, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
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
import type { ReportsTimePreset } from '@/features/reports/utils/reporting-window';

interface ReportsContentProps {
  currentUser: User;
  groupUsers: User[];
  reportsBundlePromise: Promise<ReportsPageData>;
  initialPreset: ReportsTimePreset;
  initialCustomStart?: string | undefined;
  initialCustomEnd?: string | undefined;
  initialMemberUserId?: string | undefined;
}

export default function ReportsContent({
  currentUser,
  groupUsers,
  reportsBundlePromise,
  initialPreset,
  initialCustomStart,
  initialCustomEnd,
  initialMemberUserId,
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
  const [memberOpen, setMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>(
    initialMemberUserId ?? data.memberUserId ?? currentUser.id
  );

  const pushParams = useCallback(
    (next: {
      preset?: ReportsTimePreset;
      customStart?: string;
      customEnd?: string;
      member?: string;
    }) => {
      const params = new URLSearchParams();
      params.set('preset', next.preset ?? preset);
      if (next.customStart && next.customEnd) {
        params.set('customStart', next.customStart);
        params.set('customEnd', next.customEnd);
      }
      if (next.member ?? selectedUserId) {
        params.set('member', next.member ?? selectedUserId);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, preset, router, selectedUserId]
  );

  const handlePresetChange = useCallback(
    (p: ReportsTimePreset) => {
      setPreset(p);
      if (p !== 'custom') {
        setCustomRange(null);
        pushParams({ preset: p });
      }
    },
    [pushParams]
  );

  const comparisonLabel = tHero(data.comparisonLabelKey);

  const { group, member } = data;

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
            onCustomApply={(start, end) => {
              setCustomRange({ start, end });
              pushParams({ preset: 'custom', customStart: start, customEnd: end });
            }}
          />

          <HomeDashboardMain
            id="main-reports"
            {...(isPending ? { className: 'opacity-70 transition-opacity' } : {})}
          >
            <div className={stitchReports.sectionStack}>
              <ReportsHero
                netFlow={group.netFlow}
                income={group.income}
                expenses={group.expenses}
                comparisonPercent={group.comparisonPercent}
                comparisonLabel={comparisonLabel}
              />

              <TopExpensesRanking items={group.topExpenses} />

              <AccountBreakdownSection
                rows={group.accountBreakdown}
                totalWealth={group.totalWealth}
              />

              <HistoricalBudgetSection periods={data.filteredPeriodsAllUsers} />
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
                    onChange={(id) => {
                      setSelectedUserId(id);
                      pushParams({ member: id });
                    }}
                    showAllOption={false}
                  />
                  <ReportsHero
                    netFlow={member.netFlow}
                    income={member.income}
                    expenses={member.expenses}
                    omitComparison
                  />
                  <TopExpensesRanking items={member.topExpenses} />
                  <AccountBreakdownSection
                    rows={member.accountBreakdown}
                    totalWealth={member.totalWealth}
                  />
                  <HistoricalBudgetSection periods={data.memberPeriods} />
                </div>
              ) : null}
            </div>
          </HomeDashboardMain>
        </div>
      }
    />
  );
}
