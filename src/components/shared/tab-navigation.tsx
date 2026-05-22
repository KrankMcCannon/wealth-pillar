'use client';

import { useRef, useCallback } from 'react';
import { cn } from '@/lib';
import { stitchTransactions } from '@/styles/home-design-foundation';

const tabNavigationStyles = {
  container: {
    underline: 'flex border-b border-primary/20 px-4 gap-8 pb-1',
    pills: 'flex gap-2 p-1.5 bg-card rounded-full border border-primary/20 shadow-md',
    modern: 'flex gap-2 p-1.5 bg-card rounded-full border border-primary/20 shadow-md',
    stitch:
      'flex w-full gap-1 rounded-full border border-border/35 bg-muted/85 p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]',
  },
  tab: {
    underline: {
      base: 'flex flex-col items-center justify-center border-b-2 pb-[13px] pt-4 flex-1 transition-colors',
      active: 'border-b-primary text-primary',
      inactive: 'border-b-transparent text-primary/70 hover:text-primary',
      label: 'text-sm font-semibold leading-normal',
    },
    pills: {
      base: 'flex-1 py-2 px-4 text-sm font-semibold rounded-xl transition-all duration-300',
      active: 'bg-primary text-primary-foreground shadow-lg',
      inactive: 'text-primary/70 hover:text-primary hover:bg-primary/5',
    },
    modern: {
      base: 'flex-1 py-3 px-6 text-sm font-semibold rounded-full transition-all duration-300 group',
      active: 'bg-primary text-primary-foreground shadow-lg rounded-full',
      inactive: 'text-primary/70 hover:text-primary hover:bg-primary/5 rounded-full',
    },
    stitch: {
      base: `flex-1 min-h-11 rounded-full px-3 py-2.5 text-[13px] font-medium tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35`,
      active: stitchTransactions.chipActive,
      inactive: stitchTransactions.chipInactive,
    },
  },
  icon: 'mr-2',
} as const;

interface TabNavigationProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'modern' | 'stitch';
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
      case 'stitch':
        return tabNavigationStyles.container.stitch;
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
      case 'stitch':
        return cn(
          tabNavigationStyles.tab.stitch.base,
          isActive ? tabNavigationStyles.tab.stitch.active : tabNavigationStyles.tab.stitch.inactive
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
              {tab.icon && variant !== 'underline' && variant !== 'stitch' && (
                <span className={tabNavigationStyles.icon}>{tab.icon}</span>
              )}
              <span
                className={
                  variant === 'underline' ? tabNavigationStyles.tab.underline.label : undefined
                }
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
