'use client';

import type { AccountTypeSummary } from '@/server/use-cases/reports/reports.use-cases';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { stitchHome, stitchReports } from '@/styles/home-design-foundation';
import { getBudgetProgressbarProps } from '@/features/budgets/components/budget-progress-bar';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';

interface AccountBreakdownSectionProps {
  rows: AccountTypeSummary[];
  totalWealth: number;
}

function normalizeType(type: string): string {
  const lower = type.toLowerCase();
  if (lower === 'investment' || lower === 'investments') return 'investments';
  return lower;
}

export function AccountBreakdownSection({ rows, totalWealth }: AccountBreakdownSectionProps) {
  const t = useTranslations('Reports.AccountBreakdown');
  const { format: formatMoney } = useFormatCurrency();

  const labelForType = (nt: string) => {
    switch (nt) {
      case 'checking':
        return t('types.checking');
      case 'savings':
        return t('types.savings');
      case 'payroll':
        return t('types.payroll');
      case 'cash':
        return t('types.cash');
      case 'investments':
        return t('types.investments');
      case 'other':
        return t('types.other');
      default:
        return nt.charAt(0).toUpperCase() + nt.slice(1);
    }
  };

  const visible = [...rows]
    .filter((row) => row.totalBalance !== 0)
    .sort((a, b) => b.totalBalance - a.totalBalance);
  const denom = totalWealth > 0 ? totalWealth : 1;

  return (
    <section aria-labelledby="reports-accounts-heading" className={stitchHome.scanSection}>
      <h3 id="reports-accounts-heading" className={stitchHome.scanSectionTitle}>
        {t('title')}
      </h3>
      {visible.length === 0 ? (
        <div className={stitchReports.emptyWell}>{t('empty')}</div>
      ) : (
        <ul className={stitchHome.plainList}>
          {visible.map((row) => {
            const pct = Math.round((row.totalBalance / denom) * 100);
            const label = labelForType(normalizeType(row.accountType));
            const headingId = `reports-account-${row.accountType}`;
            const shareLabel = t('percentOfWealth', { percent: pct });
            return (
              <li key={row.accountType} className={stitchReports.rankingRow}>
                <div className={stitchReports.rankingRowHeader}>
                  <h4 id={headingId} className={stitchReports.rankingLabel}>
                    {label}
                  </h4>
                  <span className={stitchReports.rankingAmount}>{formatMoney(row.totalBalance)}</span>
                </div>
                <div
                  className={cn(stitchReports.progressTrack, 'h-2')}
                  {...getBudgetProgressbarProps({ percent: pct, label: `${label}, ${shareLabel}` })}
                >
                  <div
                    className={cn('h-full min-h-[8px] rounded-full', stitchReports.progressFillPrimary)}
                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
