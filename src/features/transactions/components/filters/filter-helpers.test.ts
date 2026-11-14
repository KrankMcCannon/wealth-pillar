import { describe, expect, it } from 'vitest';
import {
  clearAdvancedFilters,
  clearAllFilters,
  defaultFiltersState,
  getActiveFilterDescriptors,
  getAdvancedFiltersCount,
  isPresetDateRange,
  isQuickPeriodSelected,
} from './filter-helpers';

describe('isQuickPeriodSelected', () => {
  it('unpresses presets when the custom range is open', () => {
    expect(isQuickPeriodSelected('all', 'all', false)).toBe(true);
    expect(isQuickPeriodSelected('all', 'all', true)).toBe(false);
    expect(isQuickPeriodSelected('week', 'week', false)).toBe(true);
    expect(isQuickPeriodSelected('week', 'week', true)).toBe(false);
  });
});

describe('isPresetDateRange', () => {
  it('treats custom as the only non-preset', () => {
    expect(isPresetDateRange('year')).toBe(true);
    expect(isPresetDateRange('custom')).toBe(false);
  });
});

describe('getAdvancedFiltersCount', () => {
  it('ignores ledger search and type chips', () => {
    expect(
      getAdvancedFiltersCount({
        ...defaultFiltersState,
        searchQuery: 'rent',
        type: 'expense',
      })
    ).toBe(0);
    expect(
      getAdvancedFiltersCount({
        ...defaultFiltersState,
        dateRange: 'month',
        accountId: 'acc-1',
      })
    ).toBe(2);
  });
});

describe('clearAdvancedFilters', () => {
  it('resets period, account, and category without touching search or type', () => {
    expect(
      clearAdvancedFilters({
        ...defaultFiltersState,
        searchQuery: 'rent',
        type: 'expense',
        dateRange: 'month',
        accountId: 'acc-1',
        categoryKey: 'food',
        budgetId: 'b1',
      })
    ).toEqual({
      ...defaultFiltersState,
      searchQuery: 'rent',
      type: 'expense',
      startDate: null,
      endDate: null,
    });
  });
});

it('clears every ledger criterion with the global reset', () => {
  expect(
    clearAllFilters({
      ...defaultFiltersState,
      searchQuery: 'rent',
      type: 'expense',
      dateRange: 'custom',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      accountId: 'a1',
      categoryKey: 'food',
      categoryKeys: ['food', 'rent'],
      budgetId: 'b1',
    })
  ).toEqual(defaultFiltersState);
});

describe('active advanced filter descriptors', () => {
  const filters = {
    ...defaultFiltersState,
    searchQuery: 'rent',
    type: 'expense' as const,
    dateRange: 'custom' as const,
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    accountId: 'unknown-account',
    categoryKey: 'unknown-category',
    categoryKeys: ['food', 'unknown-category'],
    budgetId: 'unknown-budget',
  };

  it('represents every counted filter even when reference data is unavailable', () => {
    const descriptors = getActiveFilterDescriptors(filters);
    expect(descriptors.map((descriptor) => descriptor.key)).toEqual([
      'date',
      'account',
      'category',
      'categories',
      'budget',
    ]);
    expect(descriptors).toHaveLength(getAdvancedFiltersCount(filters));
    expect(descriptors.find((descriptor) => descriptor.key === 'account')?.names).toEqual([
      undefined,
    ]);
    expect(descriptors.find((descriptor) => descriptor.key === 'budget')?.names).toEqual([
      undefined,
    ]);
  });

  it('removes only the selected criterion, including individual budget metadata', () => {
    const descriptors = getActiveFilterDescriptors(filters);
    expect(descriptors.find((descriptor) => descriptor.key === 'account')?.nextFilters).toEqual({
      ...filters,
      accountId: 'all',
    });
    expect(descriptors.find((descriptor) => descriptor.key === 'date')?.nextFilters).toEqual({
      ...filters,
      dateRange: 'all',
      startDate: null,
      endDate: null,
    });
    const { budgetId: _budgetId, ...withoutBudget } = filters;
    expect(descriptors.find((descriptor) => descriptor.key === 'budget')?.nextFilters).toEqual(
      withoutBudget
    );
  });
});
