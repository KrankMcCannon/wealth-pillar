import { describe, it, expect, vi } from 'vitest';
import { DASHBOARD_WARM_HREFS, warmDashboardRoutes } from './dashboard-route-warmer';

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ prefetch: vi.fn() }),
}));

describe('warmDashboardRoutes', () => {
  it('prefetches every dashboard destination once', () => {
    const prefetch = vi.fn();
    warmDashboardRoutes(prefetch);
    expect(prefetch.mock.calls.map((call) => call[0])).toEqual([...DASHBOARD_WARM_HREFS]);
  });
});
