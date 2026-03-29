'use client';

import { cn, amountVariants } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { Link } from '@/i18n/routing';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';

export type SummaryVariant = 'group' | 'member';

export interface SummarySectionProps {
  variant: SummaryVariant;
  /** Solo gruppo: se false mostra empty state */
  hasAccounts: boolean;
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  isFiltered: boolean;
  /** Obbligatorio per variant member (per didascalie) */
  memberName?: string;
}

export function SummarySection({
  variant,
  hasAccounts,
  totalBalance,
  totalIncome,
  totalExpenses,
  isFiltered,
  memberName,
}: SummarySectionProps) {
  const t = useTranslations('Reports.SummarySection');
  const { format: formatMoney } = useFormatCurrency();

  if (variant === 'group' && !hasAccounts) {
    return (
      <EmptyState
        title={t('empty')}
        description={t('emptyDescription')}
        action={
          <Link
            href="/transactions"
            className="text-sm font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm"
          >
            {t('emptyCta')}
          </Link>
        }
      />
    );
  }

  const netFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((netFlow / totalIncome) * 100).toFixed(1) : '0';
  const isPositiveNet = netFlow >= 0;
  const isMember = variant === 'member';

  const stripNote =
    variant === 'group'
      ? isFiltered
        ? t('groupInPeriod')
        : t('groupAllTime')
      : isFiltered
        ? t('memberInPeriod', { name: memberName ?? '—' })
        : t('memberAllTime', { name: memberName ?? '—' });

  const balanceFootnote =
    variant === 'group'
      ? t('groupBalanceFootnote')
      : t('memberBalanceFootnote', { name: memberName ?? '—' });

  return (
    <div
      className={cn(
        'bg-card border overflow-hidden',
        isMember ? 'rounded-xl border-primary/10' : 'rounded-2xl border-primary/15'
      )}
    >
      <div className={cn(isMember && 'md:flex md:flex-row md:items-stretch')}>
        <div
          className={cn(
            'border-b border-primary/8 min-w-0',
            isMember
              ? 'px-4 pt-4 pb-3 sm:px-5 sm:pt-4 sm:pb-4 md:border-b-0 md:border-r md:basis-[min(42%,15.5rem)] md:grow-0 md:shrink-0 md:py-4 md:px-5'
              : 'px-5 pt-5 pb-4 sm:px-6 sm:pt-6'
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 sm:mb-2">
            {t('totalBalance')}
          </p>
          <p
            className={cn(
              'font-bold tabular-nums tracking-tight leading-none wrap-break-word',
              isMember ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl',
              totalBalance >= 0 ? 'text-primary' : 'text-destructive'
            )}
          >
            {formatMoney(totalBalance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5 sm:mt-2 wrap-break-word">
            {balanceFootnote}
          </p>
        </div>

        <div
          className={cn(
            'grid grid-cols-3 divide-x divide-primary/8 min-w-0',
            isMember ? 'md:flex-1' : '',
            isMember ? 'py-2 sm:py-2.5 md:py-0' : ''
          )}
        >
          <div
            className={cn('px-3 py-2.5 sm:px-4 sm:py-3 min-w-0', !isMember && 'sm:px-5 sm:py-4')}
          >
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1 sm:mb-1.5">
              {t('income')}
            </p>
            <span
              className={cn(
                amountVariants({
                  type: 'income',
                  size: 'md',
                  emphasis: 'strong',
                }),
                'leading-none tabular-nums block',
                isMember ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
              )}
            >
              {formatMoney(totalIncome)}
            </span>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-3 wrap-break-word">
              {stripNote}
            </p>
          </div>

          <div
            className={cn('px-3 py-2.5 sm:px-4 sm:py-3 min-w-0', !isMember && 'sm:px-5 sm:py-4')}
          >
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1 sm:mb-1.5">
              {t('expenses')}
            </p>
            <span
              className={cn(
                amountVariants({
                  type: 'expense',
                  size: 'md',
                  emphasis: 'strong',
                }),
                'leading-none tabular-nums block',
                isMember ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
              )}
            >
              {formatMoney(totalExpenses)}
            </span>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-3 wrap-break-word">
              {stripNote}
            </p>
          </div>

          <div
            className={cn('px-3 py-2.5 sm:px-4 sm:py-3 min-w-0', !isMember && 'sm:px-5 sm:py-4')}
          >
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1 sm:mb-1.5">
              {t('netFlow')}
            </p>
            <p
              className={cn(
                'font-bold tabular-nums leading-none',
                isMember ? 'text-xs sm:text-sm' : 'text-sm sm:text-base',
                isPositiveNet ? 'text-success' : 'text-destructive'
              )}
            >
              {formatMoney(netFlow)}
            </p>
            <div
              className={cn(
                'inline-flex items-start gap-1 text-[10px] sm:text-xs font-medium mt-1 max-w-full',
                isPositiveNet ? 'text-success/70' : 'text-destructive/70'
              )}
            >
              {isPositiveNet ? (
                <TrendingUp className="w-2.5 h-2.5 shrink-0 mt-0.5" aria-hidden />
              ) : (
                <TrendingDown className="w-2.5 h-2.5 shrink-0 mt-0.5" aria-hidden />
              )}
              <span className="line-clamp-3 wrap-break-word min-w-0">
                {savingsRate}% {t('savingsRate')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
