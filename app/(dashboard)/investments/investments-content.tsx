"use client";

import { useState } from "react";
import { PageContainer, Header, BottomNavigation } from "@/components/layout";
import UserSelector from "@/components/shared/user-selector";
import { User } from "@/lib";
import TabNavigation from "@/components/shared/tab-navigation";
import { transactionStyles } from "@/styles/system";
import { SandboxForecastTab } from "@/components/investments/sandbox-forecast-tab";
import { Investment, PersonalInvestmentTab } from "@/components/investments/personal-investment-tab";

interface InvestmentsContentProps {
  currentUser: User;
  groupUsers: User[];
  investments: Investment[];
  summary: {
    totalInvested: number;
    totalTaxPaid?: number;
    totalCost?: number;
    totalPaid?: number;
    totalCurrentValue: number;
    totalReturn: number;
    totalReturnPercent: number;
  };
  indexData: any[]; // Consider defining TimeSeriesData type shared
  historicalData: any[];
  currentIndex?: string;
}

export default function InvestmentsContent({
  currentUser,
  groupUsers,
  investments,
  summary,
  indexData,
  historicalData,
  currentIndex
}: InvestmentsContentProps) {
  const [activeTab, setActiveTab] = useState("personal");

  return (
    <PageContainer>
      <div className="flex-1">
        <Header
          title="Investimenti"
          showBack={true}
          currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
          showActions={true}
        />

        <UserSelector
          currentUser={currentUser}
          users={groupUsers}
        />

        <div className={transactionStyles.tabNavigation.wrapper}>
          <TabNavigation
            tabs={[
              { id: "personal", label: "Investimenti Personali" },
              { id: "sandbox", label: "Sandbox Previsionale" },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="modern"
          />
        </div>

        <div className="mt-8 space-y-6">
          {activeTab === "personal" && (
            <main className={transactionStyles.page.main}>
              <PersonalInvestmentTab
                investments={investments}
                summary={summary}
                indexData={indexData}
                historicalData={historicalData}
                currentIndex={currentIndex}
              />
            </main>
          )}
          {activeTab === "sandbox" && (
            <main className={transactionStyles.page.main}>
              <SandboxForecastTab />
            </main>
          )}
        </div>
      </div>

      <BottomNavigation />
    </PageContainer>
  );
}
