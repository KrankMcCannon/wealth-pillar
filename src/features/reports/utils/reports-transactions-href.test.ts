import { describe, expect, it } from 'vitest';
import { format } from 'date-fns';
import { getCurrentReportingWindow, type ReportsTimePreset } from './reporting-window';
import { buildReportsCategoryTransactionsHref, buildReportsPeriodHref, buildPeriodTransactionsHref, buildReportsReserveTransactionsHref, canOpenPeriodDetail } from './reports-transactions-href';

const now = new Date('2024-06-15T12:00:00');
const categoryKey = 'food';
const categoryUuid = '11111111-2222-3333-4444-555555555555';

function parseHref(href: string) {
  const url = new URL(href, 'http://local.test');
  return url;
}

describe('buildReportsCategoryTransactionsHref', () => {
  const presets: ReportsTimePreset[] = ['yearly', 'ytd', 'monthly', 'weekly'];

  it.each(presets)('maps %s through custom date bounds from getCurrentReportingWindow', (preset) => {
    const window = getCurrentReportingWindow(preset, null, now);
    const href = buildReportsCategoryTransactionsHref({
      preset,
      customRange: null,
      scope: 'all',
      categoryKey,
      now,
    });
    const url = parseHref(href);

    expect(url.pathname).toBe('/transactions');
    expect(url.searchParams.get('dateRange')).toBe('custom');
    expect(url.searchParams.get('startDate')).toBe(format(window.start, 'yyyy-MM-dd'));
    expect(url.searchParams.get('endDate')).toBe(format(window.end, 'yyyy-MM-dd'));
    expect(url.searchParams.get('type')).toBe('expense');
    expect(url.searchParams.get('category')).toBe(categoryKey);
    expect(url.searchParams.get('categories')).toBeNull();
    expect(url.searchParams.get('user')).toBeNull();
    expect(url.searchParams.get('member')).toBeNull();
    expect(url.searchParams.get('from')).toBeNull();
    expect(href).not.toContain(categoryUuid);
  });

  it('uses the provided custom range and omits user when scope is all', () => {
    const customRange = { start: '2024-01-10', end: '2024-02-20' };
    const window = getCurrentReportingWindow('custom', customRange, now);
    const href = buildReportsCategoryTransactionsHref({
      preset: 'custom',
      customRange,
      scope: 'all',
      categoryKey,
      now,
    });
    const url = parseHref(href);

    expect(url.searchParams.get('dateRange')).toBe('custom');
    expect(url.searchParams.get('startDate')).toBe(format(window.start, 'yyyy-MM-dd'));
    expect(url.searchParams.get('endDate')).toBe(format(window.end, 'yyyy-MM-dd'));
    expect(url.searchParams.get('user')).toBeNull();
    expect(url.searchParams.get('member')).toBeNull();
  });

  it('passes member scope as user, never member', () => {
    const href = buildReportsCategoryTransactionsHref({
      preset: 'monthly',
      customRange: null,
      scope: 'member-9',
      categoryKey,
      now,
    });
    const url = parseHref(href);

    expect(url.searchParams.get('user')).toBe('member-9');
    expect(url.searchParams.get('member')).toBeNull();
    expect(url.searchParams.get('category')).toBe(categoryKey);
  });

  it('serializes the category key, not a UUID id', () => {
    const href = buildReportsCategoryTransactionsHref({
      preset: 'yearly',
      customRange: null,
      scope: 'all',
      categoryKey,
      now,
    });

    expect(href).toContain(`category=${categoryKey}`);
    expect(href).not.toContain(categoryUuid);
    expect(new URL(href, 'http://local.test').searchParams.get('category')).not.toMatch(
      /^[0-9a-f-]{36}$/i
    );
  });
});

describe('buildReportsPeriodHref', () => {
  it('preserves report query params on the period detail path', () => {
    const href = buildReportsPeriodHref({
      periodId: 'closed-1',
      preset: 'custom',
      customRange: { start: '2024-01-10', end: '2024-02-20' },
      scope: 'member-9',
    });
    const url = parseHref(href);

    expect(url.pathname).toBe('/reports/periods/closed-1');
    expect(url.searchParams.get('preset')).toBe('custom');
    expect(url.searchParams.get('customStart')).toBe('2024-01-10');
    expect(url.searchParams.get('customEnd')).toBe('2024-02-20');
    expect(url.searchParams.get('member')).toBe('member-9');
  });
});

describe('buildPeriodTransactionsHref', () => {
  it('scopes the ledger to the period dates and user', () => {
    const href = buildPeriodTransactionsHref({
      startDate: '2024-05-01',
      endDate: '2024-05-31',
      userId: 'user-1',
    });
    const url = parseHref(href);

    expect(url.pathname).toBe('/transactions');
    expect(url.searchParams.get('user')).toBe('user-1');
    expect(url.searchParams.get('dateRange')).toBe('custom');
    expect(url.searchParams.get('startDate')).toBe('2024-05-01');
    expect(url.searchParams.get('endDate')).toBe('2024-05-31');
    expect(url.searchParams.get('type')).toBeNull();
  });
});

describe('buildReportsReserveTransactionsHref', () => {
  it('opens the ledger on transfers in the report window', () => {
    const window = getCurrentReportingWindow('yearly', null, now);
    const href = buildReportsReserveTransactionsHref({
      preset: 'yearly',
      customRange: null,
      scope: 'member-9',
      now,
    });
    const url = parseHref(href);

    expect(url.pathname).toBe('/transactions');
    expect(url.searchParams.get('type')).toBe('transfer');
    expect(url.searchParams.get('dateRange')).toBe('custom');
    expect(url.searchParams.get('startDate')).toBe(format(window.start, 'yyyy-MM-dd'));
    expect(url.searchParams.get('endDate')).toBe(format(window.end, 'yyyy-MM-dd'));
    expect(url.searchParams.get('user')).toBe('member-9');
    expect(url.searchParams.get('member')).toBeNull();
  });
});

describe('canOpenPeriodDetail', () => {
  it('allows persisted periods and blocks synthetic ids', () => {
    expect(canOpenPeriodDetail({ id: 'closed-1' })).toBe(true);
    expect(canOpenPeriodDetail({ id: 'active-1' })).toBe(true);
    expect(canOpenPeriodDetail({ id: 'active-generated-u1' })).toBe(false);
  });
});
