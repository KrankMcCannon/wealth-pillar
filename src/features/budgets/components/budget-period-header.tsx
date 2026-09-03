'use client';

import { CalendarDays, MoreVertical } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { formatDateShort } from '@/lib/utils/date-utils';
import { stitchBudgets } from '@/styles/home-design-foundation';

interface BudgetPeriodHeaderProps {
  readonly periodStart: string | null;
  readonly periodEnd: string | null;
  readonly disabled?: boolean;
  readonly onClosePeriod: () => void;
  readonly onEditClosingDate: () => void;
}

export function BudgetPeriodHeader({
  periodStart,
  periodEnd,
  disabled = false,
  onClosePeriod,
  onEditClosingDate,
}: BudgetPeriodHeaderProps) {
  const t = useTranslations('Budgets.Page');
  const tHome = useTranslations('Budgets.HomeSection');
  const locale = useLocale();

  const periodLabel = periodStart
    ? `${formatDateShort(periodStart, locale)} – ${
        periodEnd ? formatDateShort(periodEnd, locale) : tHome('periodOngoing')
      }`
    : tHome('periodOngoing');

  return (
    <div className={stitchBudgets.periodHeader}>
      <p className={stitchBudgets.periodHeaderDates}>
        <CalendarDays className={stitchBudgets.periodHeaderIcon} aria-hidden />
        <span className="truncate">{periodLabel}</span>
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={stitchBudgets.overflowTrigger}
            aria-label={t('periodActionsAria')}
            disabled={disabled}
          >
            <MoreVertical className="h-5 w-5" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="min-h-11"
            onSelect={() => {
              onClosePeriod();
            }}
          >
            {t('closePeriod')}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="min-h-11"
            onSelect={() => {
              onEditClosingDate();
            }}
          >
            {t('editClosingDate')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
