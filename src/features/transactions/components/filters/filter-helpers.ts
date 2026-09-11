import type { useTranslations } from 'next-intl';
import { formatDateShort } from '@/lib/utils';
import type {
  DateRangeFilter,
  TransactionFiltersState,
} from '@/server/use-cases/transactions/transaction.logic';

export const DATE_OPTIONS: DateRangeFilter[] = ['all', 'today', 'week', 'month', 'year', 'custom'];

export const PERIOD_PRESETS = ['all', 'today', 'week', 'month', 'year'] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

export function getAdvancedFiltersCount(filters: TransactionFiltersState): number {
  let count = 0;
  if (filters.dateRange !== 'all') count++;
  if (filters.categoryKey !== 'all') count++;
  if (filters.accountId && filters.accountId !== 'all') count++;
  if (filters.categoryKeys && filters.categoryKeys.length > 0) count++;
  if (filters.budgetId) count++;
  return count;
}

export function getActiveFiltersCount(filters: TransactionFiltersState): number {
  let count = getAdvancedFiltersCount(filters);
  if (filters.searchQuery) count++;
  if (filters.type !== 'all') count++;
  return count;
}

export function clearAdvancedFilters(
  filters: TransactionFiltersState
): TransactionFiltersState {
  const { budgetId: _budgetId, categoryKeys: _categoryKeys, ...rest } = filters;
  return {
    ...rest,
    dateRange: 'all',
    categoryKey: 'all',
    accountId: 'all',
    startDate: null,
    endDate: null,
  };
}

export function getDateLabel(
  dateRange: DateRangeFilter,
  t: ReturnType<typeof useTranslations>
): string {
  switch (dateRange) {
    case 'today':
      return t('dateOptions.today');
    case 'week':
      return t('dateOptions.week');
    case 'month':
      return t('dateOptions.month');
    case 'year':
      return t('dateOptions.year');
    case 'custom':
      return t('dateOptions.custom');
    case 'all':
    default:
      return t('dateOptions.all');
  }
}

export function isPresetDateRange(dateRange: DateRangeFilter): dateRange is PeriodPreset {
  return dateRange !== 'custom';
}

export function isQuickPeriodSelected(
  pill: PeriodPreset,
  dateRange: DateRangeFilter,
  customRangeOpen: boolean
): boolean {
  return !customRangeOpen && dateRange === pill;
}

export function getDateChipLabel(
  filters: TransactionFiltersState,
  t: ReturnType<typeof useTranslations>
): string {
  if (filters.dateRange === 'all') return t('chips.period');
  if (filters.dateRange === 'custom') {
    if (filters.startDate && filters.endDate) {
      return `${formatDateShort(filters.startDate)} - ${formatDateShort(filters.endDate)}`;
    }
    if (filters.startDate) {
      return t('customRange.from', { date: formatDateShort(filters.startDate) });
    }
    if (filters.endDate) {
      return t('customRange.until', { date: formatDateShort(filters.endDate) });
    }
    return t('dateOptions.custom');
  }
  return getDateLabel(filters.dateRange as DateRangeFilter, t);
}

export const defaultFiltersState: TransactionFiltersState = {
  searchQuery: '',
  type: 'all',
  dateRange: 'all',
  categoryKey: 'all',
  accountId: 'all',
};

export function hasActiveFilters(filters: TransactionFiltersState): boolean {
  return getActiveFiltersCount(filters) > 0;
}
