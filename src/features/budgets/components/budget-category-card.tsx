'use client';

import { useMemo } from 'react';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import type { BudgetProgress, Category } from '@/lib/types';
import { stitchBudgets } from '@/styles/home-design-foundation';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';
import { BudgetCategoryLucideIcon } from './budget-category-lucide-icon';
import { BudgetProgressBar } from './budget-progress-bar';
import {
  getBudgetCategoryStatus,
  type BudgetCategoryStatus,
} from '@/features/budgets/utils/budget-status';
import { cn } from '@/lib/utils';

export type { BudgetCategoryStatus };
export { getBudgetCategoryStatus };

export interface BudgetCategoryCardProps {
  readonly progress: BudgetProgress;
  readonly categories: Category[];
  readonly isSelected: boolean;
  /** Detail route — use a Link so the destination can prefetch. */
  readonly href?: string;
  /** Seleziona il budget (modals / non-route targets). */
  readonly onPress?: () => void;
}

export function BudgetCategoryCard({
  progress,
  categories,
  isSelected,
  href,
  onPress,
}: Readonly<BudgetCategoryCardProps>) {
  const locale = useLocale();
  const t = useTranslations('Budgets.Page');
  const categoryKey = progress.categories[0] ?? '';

  const status = getBudgetCategoryStatus(progress);

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

  const className = cn(
    stitchBudgets.categoryCard,
    status === 'over' && stitchBudgets.categoryCardOver,
    isSelected && stitchBudgets.categoryCardSelected
  );
  const ariaLabel = t('categoryCard.ariaOpenDetail', { name: progress.description });

  const body = (
    <>
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
        <span className={cn(stitchBudgets.spentStrong, status === 'over' && 'text-expense')}>
          {remainingFormatted}
        </span>
      </div>

      <p className="text-sm tabular-nums text-muted-foreground">
        {spentFormatted} {t('categoryCard.of')} {limitFormatted}
      </p>

      <BudgetProgressBar
        percent={progress.percentage}
        label={t('categoryCard.progressAria', {
          name: progress.description,
          percent: Math.round(progress.percentage),
        })}
        fillClassName={cn(
          status === 'over' && stitchBudgets.progressFillOver,
          status === 'fixed' && stitchBudgets.progressFillFixed,
          status === 'onTrack' && stitchBudgets.progressFillPrimary
        )}
        limitMarkerLeftPct={status === 'over' ? limitMarkerLeftPct : null}
      />
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        prefetch
        aria-current={isSelected ? 'true' : undefined}
        aria-label={ariaLabel}
        className={className}
      >
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onPress}
      aria-current={isSelected ? 'true' : undefined}
      aria-label={ariaLabel}
      className={className}
    >
      {body}
    </button>
  );
}
