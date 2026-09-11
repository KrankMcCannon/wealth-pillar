import { describe, expect, it } from 'vitest';
import {
  clearAdvancedFilters,
  defaultFiltersState,
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
