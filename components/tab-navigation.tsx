"use client";

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
        return "flex gap-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg";
      case 'modern':
        return "flex gap-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg";
      default:
        return "flex border-b border-gray-200 px-4 gap-8 pb-1";
    }
  };

  const getTabStyles = (tab: { id: string; label: string; icon?: React.ReactNode }) => {
    const isActive = activeTab === tab.id;
    
    switch (variant) {
      case 'pills':
        return `flex-1 py-2 px-4 text-sm font-semibold rounded-xl transition-all duration-300 ${
          isActive
            ? "bg-gradient-to-r from-[hsl(var(--color-primary))] to-[hsl(var(--color-secondary))] text-white shadow-lg shadow-[hsl(var(--color-primary))]/25 scale-[1.02]"
            : "text-slate-700 hover:text-slate-900 hover:bg-white hover:shadow-md"
        }`;
      case 'modern':
        return `flex-1 py-3 px-6 text-sm font-semibold rounded-xl transition-all duration-300 group ${
          isActive
            ? "bg-gradient-to-r from-[hsl(var(--color-primary))] to-[hsl(var(--color-secondary))] text-white shadow-lg shadow-[hsl(var(--color-primary))]/25 scale-[1.02]"
            : "text-slate-700 hover:text-slate-900 hover:bg-white hover:shadow-md"
        }`;
      default:
        return `flex flex-col items-center justify-center border-b-2 pb-[13px] pt-4 flex-1 transition-colors ${
          isActive
            ? "border-b-[#7578EC] text-[#7578EC]"
            : "border-b-transparent text-[#6B7280] hover:text-[#7578EC]"
        }`;
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
