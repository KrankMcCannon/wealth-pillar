"use client";

import { PageContainer, Header, BottomNavigation } from "@/components/layout";
import UserSelector from "@/components/shared/user-selector";
import { User } from "@/lib";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalInvestmentTab, Investment } from "@/components/investments/personal-investment-tab";
import { SandboxForecastTab } from "@/components/investments/sandbox-forecast-tab";

interface InvestmentsContentProps {
  currentUser: User;
  groupUsers: User[];
  investments: Investment[];
  summary: {
    totalInvested: number;
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

        <main className="p-4 pb-14 space-y-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal" className="text-primary/60 data-[state=active]:text-primary">Investimenti Personali</TabsTrigger>
              <TabsTrigger value="sandbox" className="text-primary/60 data-[state=active]:text-primary">Sandbox Previsionale</TabsTrigger>
            </TabsList>
            <TabsContent value="personal" className="mt-6 space-y-4">
              <PersonalInvestmentTab
                investments={investments}
                summary={summary}
                indexData={indexData}
                historicalData={historicalData}
                currentIndex={currentIndex}
              />
            </TabsContent>
            <TabsContent value="sandbox" className="mt-6 space-y-4">
              <SandboxForecastTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <BottomNavigation />
    </PageContainer>
  );
}
