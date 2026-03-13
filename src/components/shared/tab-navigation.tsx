'use client';

import { useRef, useCallback } from 'react';
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
  /** Optional id of the panel controlled by the tabs (for aria-controls) */
  panelId?: string;
}

export default function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  variant = 'underline',
  className = '',
  panelId,
}: Readonly<TabNavigationProps>) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let nextIndex = index;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextIndex = Math.min(index + 1, tabs.length - 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nextIndex = Math.max(index - 1, 0);
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = tabs.length - 1;
      } else {
        return;
      }
      if (nextIndex !== index) {
        onTabChange(tabs[nextIndex]!.id);
        buttonRefs.current[nextIndex]?.focus();
      }
    },
    [tabs, onTabChange]
  );

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
          isActive ? tabNavigationStyles.tab.pills.active : tabNavigationStyles.tab.pills.inactive
        );
      case 'modern':
        return cn(
          tabNavigationStyles.tab.modern.base,
          isActive ? tabNavigationStyles.tab.modern.active : tabNavigationStyles.tab.modern.inactive
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
    <div className={className} role="tablist" aria-label="Tab navigation">
      <div className={getContainerStyles()}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId ?? undefined}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={getTabStyles(tab)}
            >
              {tab.icon && variant !== 'underline' && (
                <span className={tabNavigationStyles.icon}>{tab.icon}</span>
              )}
              <span
                className={variant === 'underline' ? tabNavigationStyles.tab.underline.label : ''}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
