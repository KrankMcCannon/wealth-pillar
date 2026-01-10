"use client";

import { cn } from '@/lib';
import { tabNavigationStyles } from './theme/tab-navigation-styles';

interface TabNavigationProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'modern';
  className?: string;
}

export default function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  variant = 'underline',
  className = ''
}: TabNavigationProps) {
  const getContainerStyles = () => {
    switch (variant) {
      case 'pills':
        return tabNavigationStyles.container.pills;
      case 'modern':
        return tabNavigationStyles.container.modern;
      default:
        return tabNavigationStyles.container.underline;
    }
  };

  const getTabStyles = (tab: { id: string; label: string; icon?: React.ReactNode }) => {
    const isActive = activeTab === tab.id;

    switch (variant) {
      case 'pills':
        return cn(
          tabNavigationStyles.tab.pills.base,
          isActive
            ? tabNavigationStyles.tab.pills.active
            : tabNavigationStyles.tab.pills.inactive
        );
      case 'modern':
        return cn(
          tabNavigationStyles.tab.modern.base,
          isActive
            ? tabNavigationStyles.tab.modern.active
            : tabNavigationStyles.tab.modern.inactive
        );
      default:
        return cn(
          tabNavigationStyles.tab.underline.base,
          isActive
            ? tabNavigationStyles.tab.underline.active
            : tabNavigationStyles.tab.underline.inactive
        );
    }
  };

  return (
    <div className={className}>
      <div className={getContainerStyles()}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={getTabStyles(tab)}
          >
            {tab.icon && variant !== 'underline' && (
              <span className={tabNavigationStyles.icon}>{tab.icon}</span>
            )}
            <span className={variant === 'underline' ? tabNavigationStyles.tab.underline.label : ''}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
