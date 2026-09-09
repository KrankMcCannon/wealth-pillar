'use client';

import { useMemo } from 'react';
import type { ReportPeriodSummary } from '@/server/use-cases/reports/reports.use-cases';
import type { User } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { initialsFromName } from '@/lib/utils/string-formatter';
import { stitchHome, stitchReports } from '@/styles/home-design-foundation';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';

type PeriodUser = Pick<User, 'id' | 'name'>;

const EMPTY_USERS: PeriodUser[] = [];

interface BudgetPeriodSectionProps {
  periods: ReportPeriodSummary[];
  users?: PeriodUser[];
  viewerId?: string;
}

function groupPeriodsByUser(
  periods: ReportPeriodSummary[],
  users: PeriodUser[],
  viewerId?: string
) {
  const byUser = new Map<string, ReportPeriodSummary[]>();
  for (const period of periods) {
    const list = byUser.get(period.userId);
    if (list) {
      list.push(period);
    } else {
      byUser.set(period.userId, [period]);
    }
  }

  const seen = new Set<string>();
  const orderedIds: string[] = [];
  if (viewerId && byUser.has(viewerId)) {
    orderedIds.push(viewerId);
    seen.add(viewerId);
  }
  for (const user of users) {
    if (byUser.has(user.id) && !seen.has(user.id)) {
      orderedIds.push(user.id);
      seen.add(user.id);
    }
  }
  for (const id of byUser.keys()) {
    if (!seen.has(id)) orderedIds.push(id);
  }

  const nameById = new Map(users.map((user) => [user.id, user.name?.trim() || user.id]));

  return orderedIds.map((userId) => ({
    userId,
    name: nameById.get(userId) ?? userId,
    periods: byUser.get(userId) ?? [],
  }));
}

function PeriodRow({
  period,
  formatMoney,
  nameAsHeading,
  budgetLabel,
  reserveLabel,
  onTrackLabel,
  overBudgetLabel,
}: {
  period: ReportPeriodSummary;
  formatMoney: (n: number) => string;
  nameAsHeading: boolean;
  budgetLabel: string;
  reserveLabel: string;
  onTrackLabel: string;
  overBudgetLabel: string;
}) {
  const TitleTag = nameAsHeading ? 'h4' : 'span';
  const remaining = period.remaining;
  const remainingSigned = `${remaining > 0 ? '+' : ''}${formatMoney(remaining)}`;
  const saved = period.reserveEnd - period.reserveStart;
  const savedSigned = `${saved > 0 ? '+' : ''}${formatMoney(saved)}`;

  return (
    <li className={`${stitchHome.plainRow} flex-col items-stretch gap-2`}>
      <TitleTag className={stitchReports.periodRangeLabel}>{period.name}</TitleTag>
      <span className={stitchReports.snapshotGrid}>
        <span className="min-w-0">
          <span className={stitchReports.periodMetricLabel}>{reserveLabel}</span>
          <span
            className={`mt-0.5 block text-base font-semibold tabular-nums ${saved < 0 ? stitchHome.amountExpense : stitchHome.amountIncome}`}
            aria-label={`${reserveLabel} ${savedSigned}`}
          >
            {savedSigned}
          </span>
          <span className="mt-0.5 block text-sm tabular-nums text-muted-foreground">
            {`${formatMoney(period.reserveStart)} → ${formatMoney(period.reserveEnd)}`}
          </span>
        </span>
        <span className="min-w-0 text-right">
          <span className={stitchReports.periodMetricLabel}>{budgetLabel}</span>
          <span
            className={`mt-0.5 block text-base font-semibold tabular-nums ${remaining < 0 ? stitchHome.amountExpense : stitchHome.amountIncome}`}
            aria-label={`${remaining < 0 ? overBudgetLabel : onTrackLabel} ${remainingSigned}`}
          >
            {remainingSigned}
          </span>
          <span className="mt-0.5 block text-sm tabular-nums text-muted-foreground">
            {formatMoney(period.allocated)}
          </span>
        </span>
      </span>
    </li>
  );
}

export function BudgetPeriodSection({
  periods,
  users = EMPTY_USERS,
  viewerId,
}: BudgetPeriodSectionProps) {
  const t = useTranslations('Reports.BudgetPeriods');
  const { format: formatMoney } = useFormatCurrency();
  const groups = useMemo(
    () => groupPeriodsByUser(periods, users, viewerId),
    [periods, users, viewerId]
  );
  const showGroups = groups.length > 1;
  const budgetLabel = t('budget');
  const reserveLabel = t('reserve');
  const onTrackLabel = t('badgeOnTrack');
  const overBudgetLabel = t('badgeOverBudget');

  return (
    <section aria-labelledby="reports-budget-periods-heading" className={stitchHome.scanSection}>
      <h3 id="reports-budget-periods-heading" className={stitchHome.scanSectionTitle}>
        {t('title')}
      </h3>
      {periods.length === 0 ? (
        <div className={stitchReports.emptyWell}>{t('empty')}</div>
      ) : showGroups ? (
        <div className="flex flex-col gap-3">
          {groups.map((group) => {
            const headingId = `reports-budget-periods-user-${group.userId}`;
            return (
              <div
                key={group.userId}
                role="group"
                aria-labelledby={headingId}
                className="flex flex-col gap-1"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className={stitchHome.budgetRowAvatar} aria-hidden>
                    {initialsFromName(group.name, { emptyFallback: '?', singleWord: 'two' })}
                  </span>
                  <h4 id={headingId} className={stitchHome.plainRowTitle}>
                    {group.name}
                  </h4>
                </div>
                <ul className={stitchHome.plainList}>
                  {group.periods.map((period) => (
                    <PeriodRow
                      key={period.id}
                      period={period}
                      formatMoney={formatMoney}
                      nameAsHeading={false}
                      budgetLabel={budgetLabel}
                      reserveLabel={reserveLabel}
                      onTrackLabel={onTrackLabel}
                      overBudgetLabel={overBudgetLabel}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <ul className={stitchHome.plainList}>
          {periods.map((period) => (
            <PeriodRow
              key={period.id}
              period={period}
              formatMoney={formatMoney}
              nameAsHeading
              budgetLabel={budgetLabel}
              reserveLabel={reserveLabel}
              onTrackLabel={onTrackLabel}
              overBudgetLabel={overBudgetLabel}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
