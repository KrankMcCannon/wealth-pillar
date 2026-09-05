'use client';

import type { AccountTypeSummary } from '@/server/use-cases/reports/reports.use-cases';
import { useTranslations } from 'next-intl';
import { stitchHome, stitchReports } from '@/styles/home-design-foundation';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';
import { SplitBar } from './split-bar';

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
  const liquidityTotal = totalSpendable + totalReserve;
  const spendableShare = liquidityTotal > 0 ? (totalSpendable / liquidityTotal) * 100 : 0;

  return (
    <section aria-labelledby="reports-accounts-heading" className={stitchHome.scanSection}>
      <h3 id="reports-accounts-heading" className={stitchHome.scanSectionTitle}>
        {t('title')}
      </h3>
      {liquidityTotal > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            {tHero('spendableBalance')}{' '}
            <span className="tabular-nums text-foreground">{formatMoney(totalSpendable)}</span>
            {' · '}
            {tHero('reserveBalance')}{' '}
            <span className="tabular-nums text-foreground">{formatMoney(totalReserve)}</span>
          </p>
          <SplitBar
            leftPercent={spendableShare}
            leftClassName="bg-primary"
            rightClassName="bg-muted-foreground/35"
            label={t('liquidityAria', {
              spendable: formatMoney(totalSpendable),
              reserve: formatMoney(totalReserve),
            })}
            valuetext={t('liquidityAria', {
              spendable: formatMoney(totalSpendable),
              reserve: formatMoney(totalReserve),
            })}
          />
        </>
      ) : null}
      {sorted.length === 0 ? (
        <div className={stitchReports.emptyWell}>{t('empty')}</div>
      ) : (
        <ul className={stitchHome.plainList}>
          {sorted.map((row) => {
            const pct = Math.round((row.totalBalance / denom) * 100);
            const label = labelForType(normalizeType(row.accountType));
            const headingId = `reports-account-${row.accountType}`;
            return (
              <li key={row.accountType} className={stitchHome.plainRow}>
                <span className="min-w-0">
                  <h4 id={headingId} className={stitchHome.plainRowTitle}>
                    {label}
                  </h4>
                  <span className={stitchHome.plainRowMeta}>
                    {t('percentOfWealth', { percent: pct })}
                  </span>
                </span>
                <span className="shrink-0 text-base font-semibold tabular-nums text-foreground">
                  {formatMoney(row.totalBalance)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
