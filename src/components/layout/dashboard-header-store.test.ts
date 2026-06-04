import { describe, it, expect, beforeEach } from 'vitest';
import {
  defaultDashboardHeaderConfig,
  useDashboardHeaderStore,
} from '@/components/layout/dashboard-header-store';

describe('dashboard-header-store', () => {
  beforeEach(() => {
    useDashboardHeaderStore.getState().resetHeader();
  });

  it('starts with dashboard default header config', () => {
    expect(useDashboardHeaderStore.getState().config).toEqual(defaultDashboardHeaderConfig);
  });

  it('sets and resets header config', () => {
    useDashboardHeaderStore.getState().setHeader({
      title: 'Accounts',
      showBack: true,
      isDashboard: false,
    });

    expect(useDashboardHeaderStore.getState().config).toMatchObject({
      title: 'Accounts',
      showBack: true,
      isDashboard: false,
    });

    useDashboardHeaderStore.getState().resetHeader();
    expect(useDashboardHeaderStore.getState().config).toEqual(defaultDashboardHeaderConfig);
  });
});
