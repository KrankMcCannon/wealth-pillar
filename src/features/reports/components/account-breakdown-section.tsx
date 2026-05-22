'use client';

import type { AccountTypeSummary } from '@/server/use-cases/reports/reports.use-cases';
import { Banknote, Briefcase, Landmark, PiggyBank, TrendingUp, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { stitchReports } from '@/styles/home-design-foundation';
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

  const sorted = [...rows].sort((a, b) => b.totalBalance - a.totalBalance);
  const denom = totalWealth > 0 ? totalWealth : 1;

  if (sorted.length === 0) {
    return (
      <section aria-labelledby="reports-accounts-heading">
        <h3 id="reports-accounts-heading" className={cn(stitchReports.sectionTitle, 'mb-3')}>
          {t('title')}
        </h3>
        <div className={stitchReports.emptyWell}>{t('empty')}</div>
      </section>
    );
  }

  return (
    <section aria-labelledby="reports-accounts-heading">
      <h3 id="reports-accounts-heading" className={cn(stitchReports.sectionTitle, 'mb-3')}>
        {t('title')}
      </h3>
      <div className="flex flex-col gap-2">
        {sorted.map((row, idx) => {
          const Icon = iconForType(row.accountType);
          const pct = Math.round((row.totalBalance / denom) * 100);
          const label = labelForType(normalizeType(row.accountType));
          return (
            <div key={row.accountType} className={stitchReports.accountRow}>
              <div className="flex min-w-0 items-center gap-3">
                <div className={iconWrapClass(row.accountType, idx)}>
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{label}</p>
                  <p className={stitchReports.accountMeta}>
                    {t('percentOfWealth', { percent: pct })}
                  </p>
                </div>
              </div>
              <p className={stitchReports.accountAmount}>{formatMoney(row.totalBalance)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
