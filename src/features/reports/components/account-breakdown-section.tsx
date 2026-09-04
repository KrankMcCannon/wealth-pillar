'use client';

import type { AccountTypeSummary } from '@/server/use-cases/reports/reports.use-cases';
import { Banknote, Briefcase, Landmark, PiggyBank, TrendingUp, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { stitchReports, stitchStatMini } from '@/styles/home-design-foundation';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';
import { roundMoney } from '@/lib/utils/money';

interface AccountBreakdownSectionProps {
  rows: AccountTypeSummary[];
  totalWealth: number;
  totalSpendable: number;
  totalReserve: number;
}

function normalizeType(type: string): string {
  const lower = type.toLowerCase();
  if (lower === 'investment' || lower === 'investments') return 'investments';
  return lower;
}

function iconForType(type: string) {
  const t = normalizeType(type);
  if (t === 'checking') return Landmark;
  if (t === 'savings') return PiggyBank;
  if (t === 'cash') return Banknote;
  if (t === 'payroll') return Briefcase;
  if (t === 'investments') return TrendingUp;
  if (t === 'other') return Wallet;
  return Landmark;
}

function iconWrapClass(type: string, idx: number) {
  const t = normalizeType(type);
  if (t === 'checking' || t === 'cash' || idx === 0) return stitchReports.accountIconWrap;
  return stitchReports.accountIconWrapMuted;
}

export function AccountBreakdownSection({
  rows,
  totalWealth,
  totalSpendable,
  totalReserve,
}: AccountBreakdownSectionProps) {
  const t = useTranslations('Reports.AccountBreakdown');
  const tHero = useTranslations('Reports.Hero');
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

  const sorted = [...rows].sort((a, b) => b.totalBalance - a.totalBalance);
  const denom = totalWealth > 0 ? totalWealth : 1;

  return (
    <section aria-labelledby="reports-accounts-heading">
      <h3 id="reports-accounts-heading" className={cn(stitchReports.sectionTitle, 'mb-3')}>
        {t('title')}
      </h3>
      <div className={cn(stitchReports.snapshotGrid, 'mb-2')}>
        <div className={cn(stitchStatMini.item, stitchStatMini.itemSuccess)}>
          <p className={stitchStatMini.label}>{tHero('spendableBalance')}</p>
          <p className={stitchStatMini.valueSuccess}>{formatMoney(totalSpendable)}</p>
        </div>
        <div className={cn(stitchStatMini.item, stitchStatMini.itemPrimary)}>
          <p className={stitchStatMini.label}>{tHero('reserveBalance')}</p>
          <p className={stitchStatMini.valuePrimary}>{formatMoney(totalReserve)}</p>
        </div>
      </div>
      {sorted.length === 0 ? (
        <div className={stitchReports.emptyWell}>{t('empty')}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((row, idx) => {
            const Icon = iconForType(row.accountType);
            const pct = Math.round((row.totalBalance / denom) * 100);
            const label = labelForType(normalizeType(row.accountType));
            const periodNet = roundMoney(row.totalEarned - row.totalSpent);
            const periodPositive = periodNet >= 0;
            const headingId = `reports-account-${row.accountType}`;
            return (
              <article
                key={row.accountType}
                className={stitchReports.accountCard}
                aria-labelledby={headingId}
              >
                <header className={stitchReports.periodHeaderRow}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={iconWrapClass(row.accountType, idx)}>
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <h4
                      id={headingId}
                      className="truncate text-base font-semibold text-foreground"
                    >
                      {label}
                    </h4>
                  </div>
                  <p
                    className={cn(
                      'shrink-0 text-xl font-semibold tabular-nums leading-none',
                      periodPositive ? 'text-income' : 'text-expense'
                    )}
                  >
                    <span className="sr-only">{t('periodNet')} </span>
                    {periodPositive ? '+' : ''}
                    {formatMoney(periodNet)}
                  </p>
                </header>
                <dl className={stitchReports.accountMetricGrid}>
                  <div>
                    <dt className={stitchReports.accountMetricLabel}>{t('income')}</dt>
                    <dd className={cn(stitchReports.accountMetricValue, 'text-income')}>
                      {formatMoney(row.totalEarned)}
                    </dd>
                  </div>
                  <div>
                    <dt className={stitchReports.accountMetricLabel}>{t('expense')}</dt>
                    <dd className={cn(stitchReports.accountMetricValue, 'text-expense')}>
                      {formatMoney(row.totalSpent)}
                    </dd>
                  </div>
                  <div>
                    <dt className={stitchReports.accountMetricLabel}>{t('balance')}</dt>
                    <dd className={stitchReports.accountMetricValue}>
                      {formatMoney(row.totalBalance)}
                    </dd>
                  </div>
                  <div>
                    <dt className={stitchReports.accountMetricLabel}>{t('ofWealth')}</dt>
                    <dd className={stitchReports.accountMetricValue}>
                      {t('percentOfWealth', { percent: pct })}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
