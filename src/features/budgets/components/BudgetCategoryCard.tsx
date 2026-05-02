'use client';

import { useMemo } from 'react';

import { useLocale, useTranslations } from 'next-intl';
import type { BudgetProgress, Category } from '@/lib/types';
import { stitchBudgets } from '@/styles/home-design-foundation';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';
import { BudgetCategoryLucideIcon } from './budget-category-lucide-icon';
import { cn } from '@/lib/utils';

export type BudgetCategoryStatus = 'onTrack' | 'fixed' | 'over';

export function getBudgetCategoryStatus(progress: BudgetProgress): BudgetCategoryStatus {
  if (progress.remaining < 0 || progress.percentage > 100) return 'over';
  if (progress.percentage >= 100 && progress.remaining >= 0) return 'fixed';
  return 'onTrack';
}

export interface BudgetCategoryCardProps {
  readonly progress: BudgetProgress;
  readonly categories: Category[];
  readonly isSelected: boolean;
  /** Seleziona il budget e apre il modal di modifica. */
  readonly onPress: () => void;
}

export function BudgetCategoryCard({
  progress,
  categories,
  isSelected,
  onPress,
}: Readonly<BudgetCategoryCardProps>) {
  const locale = useLocale();
  const t = useTranslations('Budgets.Page');
  const categoryKey = progress.categories[0] ?? '';

  const status = getBudgetCategoryStatus(progress);
  const barWidthPct = Math.min(100, Math.max(0, progress.percentage));

  const limitMarkerLeftPct = useMemo(() => {
    if (status !== 'over' || progress.spent <= 0 || progress.amount <= 0) return null;
    return Math.min(100, (progress.amount / progress.spent) * 100);
  }, [status, progress.spent, progress.amount]);

  const spentFormatted = formatCurrencyLocale(progress.spent, locale);
  const limitFormatted = formatCurrencyLocale(progress.amount, locale);
  const remainingFormatted = formatCurrencyLocale(progress.remaining, locale);

  const iconWrapClass =
    status === 'over'
      ? stitchBudgets.iconWrapOver
      : status === 'fixed'
        ? stitchBudgets.iconWrapFixed
        : stitchBudgets.iconWrapOnTrack;

  return (
    <button
      type="button"
      onClick={onPress}
      aria-current={isSelected ? 'true' : undefined}
      aria-label={t('categoryCard.ariaOpenEdit', { name: progress.description })}
      className={cn(
        stitchBudgets.categoryCard,
        status === 'over' && stitchBudgets.categoryCardOver,
        isSelected && stitchBudgets.categoryCardSelected
      )}
    >
      {status === 'over' ? (
        <div className={stitchBudgets.categoryCardOverGlow} aria-hidden />
      ) : null}

      <div className={stitchBudgets.categoryHeaderRow}>
        <div className={stitchBudgets.categoryTitleRow}>
          <span className={iconWrapClass} aria-hidden>
            <BudgetCategoryLucideIcon
              categoryIdentifier={categoryKey}
              categories={categories}
              className="h-5 w-5 shrink-0"
            />
          </span>
          <h3 className={stitchBudgets.categoryTitle}>{progress.description}</h3>
        </div>

        {status === 'onTrack' ? (
          <span className={stitchBudgets.badgeOnTrack}>{t('categoryCard.badgeOnTrack')}</span>
        ) : null}
        {status === 'fixed' ? (
          <span className={stitchBudgets.badgeFixed}>{t('categoryCard.badgeFixed')}</span>
        ) : null}
        {status === 'over' ? (
          <span className={stitchBudgets.badgeOver}>{t('categoryCard.badgeOver')}</span>
        ) : null}
      </div>

      <div className={stitchBudgets.spentRow}>
        <div className={stitchBudgets.spentAmountRow}>
          <div className="flex items-baseline gap-1">
            <span className={cn(stitchBudgets.spentStrong, status === 'over' && 'text-[#ffb4ab]')}>
              {spentFormatted}
            </span>
            <span className={stitchBudgets.spentLabel}>{t('categoryCard.spentLabel')}</span>
          </div>
          <span className={stitchBudgets.spentOf}>
            {t('categoryCard.of')} {limitFormatted}
          </span>
        </div>

        <div className={stitchBudgets.progressTrack}>
          <div
            className={cn(
              'relative z-1 h-full',
              status === 'over' && stitchBudgets.progressFillOver,
              status === 'fixed' && stitchBudgets.progressFillFixed,
              status === 'onTrack' && stitchBudgets.progressFillPrimary
            )}
            style={{ width: `${status === 'over' ? 100 : barWidthPct}%` }}
          />
          {status === 'over' && limitMarkerLeftPct != null ? (
            <div
              className={cn(stitchBudgets.progressLimitMarker, 'z-10')}
              style={{ left: `${limitMarkerLeftPct}%`, transform: 'translateX(-50%)' }}
              aria-hidden
            />
          ) : null}
        </div>

        <div className={stitchBudgets.footerRow}>
          <span
            className={cn(
              stitchBudgets.footerMuted,
              status === 'over' && 'font-medium text-[#ffb4ab]'
            )}
          >
            {status === 'fixed'
              ? t('categoryCard.footerPaidInFull')
              : t('categoryCard.footerPercentUsed', { percent: Math.round(progress.percentage) })}
          </span>
          <span
            className={cn(
              status === 'over' && stitchBudgets.footerDanger,
              status === 'fixed' && stitchBudgets.footerMuted,
              status === 'onTrack' && stitchBudgets.footerAccent
            )}
          >
            {status === 'over'
              ? t('categoryCard.footerOver', {
                  amount: formatCurrencyLocale(progress.remaining, locale),
                })
              : t('categoryCard.footerLeft', { amount: remainingFormatted })}
          </span>
        </div>
      </div>
    </button>
  );
}
