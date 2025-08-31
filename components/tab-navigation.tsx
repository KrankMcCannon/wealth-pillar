"use client";

interface TabNavigationProps {
  tabs: Array<{
    id: string;
    label: string;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="pb-1">
      <div className="flex border-b border-gray-200 px-4 gap-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center border-b-2 pb-[13px] pt-4 flex-1 transition-colors ${
              activeTab === tab.id
                ? "border-b-[#7578EC] text-[#7578EC]"
                : "border-b-transparent text-[#6B7280] hover:text-[#7578EC]"
            }`}
          >
            <p className="text-sm font-semibold leading-normal">{tab.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
