import { create } from 'zustand';

export interface DashboardHeaderConfig {
  title?: string;
  showBack?: boolean;
  isDashboard?: boolean;
  onBack?: () => void;
}

interface DashboardHeaderState {
  config: DashboardHeaderConfig;
  setHeader: (config: DashboardHeaderConfig) => void;
  resetHeader: () => void;
}

export const defaultDashboardHeaderConfig: DashboardHeaderConfig = {
  isDashboard: true,
};

export const useDashboardHeaderStore = create<DashboardHeaderState>()((set) => ({
  config: defaultDashboardHeaderConfig,
  setHeader: (config) => set({ config }),
  resetHeader: () => set({ config: defaultDashboardHeaderConfig }),
}));
