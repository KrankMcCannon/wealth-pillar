import { describe, it, expect, vi } from 'vitest';
import { DASHBOARD_WARM_HREFS, warmDashboardRoutes } from './dashboard-route-warmer';

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ prefetch: vi.fn() }),
  usePathname: () => '/home',
}));

describe('warmDashboardRoutes', () => {
  it('prefetches every dashboard destination once', () => {
    const prefetch = vi.fn();
    warmDashboardRoutes(prefetch);
    expect(prefetch.mock.calls.map((call) => call[0])).toEqual([...DASHBOARD_WARM_HREFS]);
  });

  it('skips the route the user is already on', () => {
    const prefetch = vi.fn();
    warmDashboardRoutes(prefetch, '/home');
    expect(prefetch.mock.calls.map((call) => call[0])).not.toContain('/home');
    expect(prefetch).toHaveBeenCalledTimes(DASHBOARD_WARM_HREFS.length - 1);
  });
});
