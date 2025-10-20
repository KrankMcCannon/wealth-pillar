"use client";

import { cn } from "@/lib/utils";

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
        return "flex gap-2 p-1.5 bg-card rounded-full border border-primary/20 shadow-md";
      case 'modern':
        return "flex gap-2 p-1.5 bg-card rounded-full border border-primary/20 shadow-md";
      default:
        return "flex border-b border-primary/20 px-4 gap-8 pb-1";
    }
  };

  const getTabStyles = (tab: { id: string; label: string; icon?: React.ReactNode }) => {
    const isActive = activeTab === tab.id;

    switch (variant) {
      case 'pills':
        return cn(
          "flex-1 py-2 px-4 text-sm font-semibold rounded-xl transition-all duration-300",
          isActive
            ? "bg-primary text-primary-foreground shadow-lg"
            : "text-primary/70 hover:text-primary hover:bg-primary/5"
        );
      case 'modern':
        return cn(
          "flex-1 py-3 px-6 text-sm font-semibold rounded-xl transition-all duration-300 group",
          isActive
            ? "bg-primary text-primary-foreground shadow-lg"
            : "text-primary/70 hover:text-primary hover:bg-primary/5"
        );
      default:
        return cn(
          "flex flex-col items-center justify-center border-b-2 pb-[13px] pt-4 flex-1 transition-colors",
          isActive
            ? "border-b-primary text-primary"
            : "border-b-transparent text-primary/70 hover:text-primary"
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
              <span className="mr-2">{tab.icon}</span>
            )}
            <span className={variant === 'underline' ? 'text-sm font-semibold leading-normal' : ''}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
