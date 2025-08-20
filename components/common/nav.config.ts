import { HomeIcon, TransactionIcon, InvestmentIcon, SettingsIcon, ChartBarIcon } from './Icons';
import { ComponentType, SVGProps } from 'react';

export interface NavItemConfig {
  to: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/transactions', label: 'Transazioni', Icon: TransactionIcon },
  { to: '/investments', label: 'Investimenti', Icon: InvestmentIcon },
  { to: '/reports', label: 'Report', Icon: ChartBarIcon },
  { to: '/settings', label: 'Impostazioni', Icon: SettingsIcon },
];
