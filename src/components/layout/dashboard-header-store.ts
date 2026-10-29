import { create } from 'zustand';

export interface DashboardHeaderConfig {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  /** False until a page sets the bar — do not flash the app name as a fake title. */
  ready?: boolean;
}

interface DashboardHeaderState {
  config: DashboardHeaderConfig;
  setHeader: (config: DashboardHeaderConfig) => void;
  resetHeader: () => void;
}

export const defaultDashboardHeaderConfig: DashboardHeaderConfig = {};

export const useDashboardHeaderStore = create<DashboardHeaderState>()((set) => ({
  config: defaultDashboardHeaderConfig,
  setHeader: (config) => set({ config: { ...config, ready: true } }),
  resetHeader: () => set({ config: defaultDashboardHeaderConfig }),
}));
