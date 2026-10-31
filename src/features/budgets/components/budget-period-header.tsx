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
  readonly onStartSalaryPeriod: () => void;
  readonly onEditClosingDate: () => void;
}

export function BudgetPeriodHeader({
  periodStart,
  periodEnd,
  disabled = false,
  onStartSalaryPeriod,
  onEditClosingDate,
}: BudgetPeriodHeaderProps) {
  const t = useTranslations('Budgets.Page');
  const tHome = useTranslations('Budgets.HomeSection');
  const locale = useLocale();

  const periodLabel = periodStart
    ? `${formatDateShort(periodStart, locale) + ' ' + String(periodStart).slice(0, 4)} – ${
        periodEnd
          ? formatDateShort(periodEnd, locale) + ' ' + String(periodEnd).slice(0, 4)
          : tHome('periodOngoing')
      }`
    : tHome('periodOngoing');

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
      <p className="flex min-w-0 items-center gap-2 text-sm font-semibold">
        <CalendarDays className={stitchBudgets.periodHeaderIcon} aria-hidden />
        <span className="break-words">{periodLabel}</span>
      </p>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          className="min-h-11 rounded-lg px-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring"
          disabled={disabled}
          onClick={onStartSalaryPeriod}
        >
          {t('startSalaryPeriod')}
        </button>
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
            <DropdownMenuItem className="min-h-11" onSelect={onEditClosingDate}>
              {t('editClosingDate')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
