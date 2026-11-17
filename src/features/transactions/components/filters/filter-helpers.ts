import type { useTranslations } from 'next-intl';
import type { Category } from '@/lib/types';
import { formatDateShort } from '@/lib/utils';
import type {
  DateRangeFilter,
  TransactionFiltersState,
} from '@/server/use-cases/transactions/transaction.logic';

export const DATE_OPTIONS: DateRangeFilter[] = ['all', 'today', 'week', 'month', 'year', 'custom'];

export const PERIOD_PRESETS = ['all', 'today', 'week', 'month', 'year'] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

export interface ActiveFilterDescriptor {
  key: 'date' | 'account' | 'category' | 'categories' | 'budget' | 'reserve';
  names: (string | undefined)[];
  nextFilters: TransactionFiltersState;
}

/** Advanced ledger filters; search and type have their own visible controls. */
export function getActiveFilterDescriptors(
  filters: TransactionFiltersState,
  references: {
    accountNames?: Record<string, string>;
    categories?: Category[];
    budgetName?: string | undefined;
  } = {}
): ActiveFilterDescriptor[] {
  const descriptors: ActiveFilterDescriptor[] = [];
  if (filters.dateRange !== 'all') {
    descriptors.push({
      key: 'date',
      names: [],
      nextFilters: { ...filters, dateRange: 'all', startDate: null, endDate: null },
    });
  }
  if (filters.accountId && filters.accountId !== 'all') {
    descriptors.push({
      key: 'account',
      names: [references.accountNames?.[filters.accountId]],
      nextFilters: { ...filters, accountId: 'all' },
    });
  }
  if (filters.categoryKey !== 'all') {
    descriptors.push({
      key: 'category',
      names: [
        references.categories?.find((category) => category.key === filters.categoryKey)?.label,
      ],
      nextFilters: { ...filters, categoryKey: 'all' },
    });
  }
  if (filters.categoryKeys?.length) {
    const { categoryKeys: _categoryKeys, ...nextFilters } = filters;
    descriptors.push({
      key: 'categories',
      names: filters.categoryKeys.map(
        (key) => references.categories?.find((category) => category.key === key)?.label
      ),
      nextFilters,
    });
  }
  if (filters.budgetId) {
    const { budgetId: _budgetId, ...nextFilters } = filters;
    descriptors.push({ key: 'budget', names: [references.budgetName], nextFilters });
  }
  if (filters.reserve) {
    const { reserve: _reserve, ...nextFilters } = filters;
    descriptors.push({ key: 'reserve', names: [], nextFilters });
  }
  return descriptors;
}

export function getActiveFilterLabel(
  descriptor: ActiveFilterDescriptor,
  filters: TransactionFiltersState,
  t: ReturnType<typeof useTranslations>
): string {
  if (descriptor.key === 'date') return getDateChipLabel(filters, t);
  if (descriptor.key === 'reserve') return t('chips.reserve');
  if (descriptor.key === 'categories') {
    return descriptor.names.map((name) => name ?? t('unavailable.category')).join(', ');
  }
  const name = descriptor.names[0];
  if (descriptor.key === 'budget' && name) return t('budget.bannerWithName', { name });
  return name ?? t(`unavailable.${descriptor.key}`);
}

export function getAdvancedFiltersCount(filters: TransactionFiltersState): number {
  return getActiveFilterDescriptors(filters).length;
}

export function getActiveFiltersCount(filters: TransactionFiltersState): number {
  let count = getAdvancedFiltersCount(filters);
  if (filters.searchQuery) count++;
  if (filters.type !== 'all') count++;
  return count;
}

export function clearAdvancedFilters(filters: TransactionFiltersState): TransactionFiltersState {
  const { budgetId: _budgetId, categoryKeys: _categoryKeys, reserve: _reserve, ...rest } = filters;
  return {
    ...rest,
    dateRange: 'all',
    categoryKey: 'all',
    accountId: 'all',
    startDate: null,
    endDate: null,
  };
}

export function clearAllFilters(_filters: TransactionFiltersState): TransactionFiltersState {
  return { ...defaultFiltersState };
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
  return getDateLabel(filters.dateRange, t);
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
