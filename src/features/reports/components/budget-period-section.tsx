'use client';

import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import type { ReportPeriodSummary } from '@/server/use-cases/reports/reports.use-cases';
import type { User } from '@/lib/types';
import { initialsFromName } from '@/lib/utils/string-formatter';
import { cn } from '@/lib/utils';
import { stitchHome, stitchReports } from '@/styles/home-design-foundation';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';
import { canOpenPeriodDetail } from '@/features/reports/utils/reports-transactions-href';
import {
  isPeriodGroupOpen,
  readPeriodGroupsOpen,
  restoreReportsScrollY,
  saveReportsScrollY,
  writePeriodGroupsOpen,
} from '@/features/reports/utils/reports-view-state';

type PeriodUser = Pick<User, 'id' | 'name'>;

const EMPTY_USERS: PeriodUser[] = [];

interface BudgetPeriodSectionProps {
  periods: ReportPeriodSummary[];
  users?: PeriodUser[];
  viewerId?: string;
  hrefForPeriod?: (period: ReportPeriodSummary) => string;
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
  onTrackLabel,
  overBudgetLabel,
  href,
  openLabel,
}: {
  period: ReportPeriodSummary;
  formatMoney: (n: number) => string;
  nameAsHeading: boolean;
  onTrackLabel: string;
  overBudgetLabel: string;
  href?: string | undefined;
  openLabel?: string | undefined;
}) {
  const TitleTag = nameAsHeading ? 'h4' : 'span';
  const remaining = period.remaining;
  const remainingSigned = `${remaining > 0 ? '+' : ''}${formatMoney(remaining)}`;
  const allocatedVsSpent = `${formatMoney(period.allocated)} − ${formatMoney(period.spendableSpent)}`;

  const body = (
    <>
      <span className="min-w-0">
        <TitleTag className={stitchHome.plainRowTitle}>{period.name}</TitleTag>
        <span className="block text-sm tabular-nums text-muted-foreground">{allocatedVsSpent}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <span
          className={cn(
            'text-base font-semibold tabular-nums',
            remaining < 0 ? stitchHome.amountExpense : stitchHome.amountIncome
          )}
          aria-label={`${remaining < 0 ? overBudgetLabel : onTrackLabel} ${remainingSigned}`}
        >
          {remainingSigned}
        </span>
        {href ? <ChevronRight className={stitchReports.rankingChevron} aria-hidden /> : null}
      </span>
    </>
  );

  return (
    <li>
      {href ? (
        <Link
          href={href}
          className={stitchReports.periodRowLink}
          aria-label={openLabel}
          onClick={() => saveReportsScrollY()}
        >
          {body}
        </Link>
      ) : (
        <div className={stitchReports.periodRow}>{body}</div>
      )}
    </li>
  );
}

function UserPeriodGroup({
  userId,
  name,
  headingId,
  open,
  toggleLabel,
  onOpenChange,
  children,
}: {
  userId: string;
  name: string;
  headingId: string;
  open: boolean;
  toggleLabel: string;
  onOpenChange: (userId: string, open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div role="group" aria-labelledby={headingId} className="flex flex-col gap-1">
      <details
        className={stitchReports.periodUserGroup}
        open={open}
        onToggle={(event) => {
          const nextOpen = event.currentTarget.open;
          if (nextOpen === open) return;
          onOpenChange(userId, nextOpen);
        }}
      >
        <summary className={stitchReports.periodUserSummary} aria-label={toggleLabel}>
          <span className={stitchHome.budgetRowAvatar} aria-hidden>
            {initialsFromName(name, { emptyFallback: '?', singleWord: 'two' })}
          </span>
          <h4 id={headingId} className={stitchHome.plainRowTitle}>
            {name}
          </h4>
          <ChevronDown className={stitchReports.periodUserChevron} aria-hidden />
        </summary>
        {children}
      </details>
    </div>
  );
}

export function BudgetPeriodSection({
  periods,
  users = EMPTY_USERS,
  viewerId,
  hrefForPeriod,
}: BudgetPeriodSectionProps) {
  const t = useTranslations('Reports.BudgetPeriods');
  const { format: formatMoney } = useFormatCurrency();
  const groups = useMemo(
    () => groupPeriodsByUser(periods, users, viewerId),
    [periods, users, viewerId]
  );
  const showGroups = groups.length > 1;
  const onTrackLabel = t('badgeOnTrack');
  const overBudgetLabel = t('badgeOverBudget');
  const [openByUser, setOpenByUser] = useState<Record<string, boolean>>({});
  const [storageReady, setStorageReady] = useState(!showGroups);

  useLayoutEffect(() => {
    if (!showGroups) {
      restoreReportsScrollY();
      return;
    }
    setOpenByUser(readPeriodGroupsOpen());
    setStorageReady(true);
  }, [showGroups]);

  useLayoutEffect(() => {
    if (!storageReady) return;
    restoreReportsScrollY();
  }, [storageReady]);

  const onOpenChange = (userId: string, open: boolean) => {
    setOpenByUser((prev) => {
      const next = { ...prev, [userId]: open };
      writePeriodGroupsOpen(next);
      return next;
    });
  };

  const renderRow = (period: ReportPeriodSummary, nameAsHeading: boolean) => {
    const href =
      hrefForPeriod && canOpenPeriodDetail(period) ? hrefForPeriod(period) : undefined;
    return (
      <PeriodRow
        key={period.id}
        period={period}
        formatMoney={formatMoney}
        nameAsHeading={nameAsHeading}
        onTrackLabel={onTrackLabel}
        overBudgetLabel={overBudgetLabel}
        href={href}
        openLabel={
          href
            ? t('openPeriodAria', {
                name: period.name,
                status: period.remaining < 0 ? overBudgetLabel : onTrackLabel,
                remaining: `${period.remaining > 0 ? '+' : ''}${formatMoney(period.remaining)}`,
              })
            : undefined
        }
      />
    );
  };

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
              <UserPeriodGroup
                key={group.userId}
                userId={group.userId}
                name={group.name}
                headingId={headingId}
                open={isPeriodGroupOpen(group.userId, openByUser)}
                toggleLabel={t('toggleUserPeriodsAria', { name: group.name })}
                onOpenChange={onOpenChange}
              >
                <ul className={stitchReports.periodList}>
                  {group.periods.map((period) => renderRow(period, false))}
                </ul>
              </UserPeriodGroup>
            );
          })}
        </div>
      ) : (
        <ul className={stitchReports.periodList}>
          {periods.map((period) => renderRow(period, true))}
        </ul>
      )}
    </section>
  );
}
