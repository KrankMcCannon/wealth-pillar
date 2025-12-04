"use client";

import { PageContainer, PageHeaderWithBack, SectionHeader, BottomNavigation } from "@/src/components/layout";
import { useUserFilter } from "@/hooks";
import UserSelector from "@/src/components/shared/user-selector";
import { EnhancedHolding } from "@/src/lib";
import { PieChart } from "lucide-react";
import type { DashboardDataProps } from "@/lib/auth/get-dashboard-data";

export default function InvestmentsContent({ currentUser, groupUsers }: DashboardDataProps) {
  const { selectedGroupFilter, setSelectedGroupFilter } = useUserFilter();

  return (
    <PageContainer className="bg-[#F8FAFC]">
      <div className="flex-1">
        <PageHeaderWithBack
          title="Investimenti"
          variant="light"
          className="shadow-sm"
          contentClassName="flex items-center justify-between"
          titleClassName="text-[#1F2937] text-xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center"
          backButtonClassName="text-[#1F2937] flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-[#EFF2FE] transition-colors"
          actions={<div className="size-10" />}
        />

        <UserSelector
          users={groupUsers}
          currentUser={currentUser}
          selectedGroupFilter={selectedGroupFilter}
          onGroupFilterChange={setSelectedGroupFilter}
        />

        <main className="p-4 pb-24">
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 mb-6">
            <div className="flex w-64 shrink-0 flex-col rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-base font-bold">Portafoglio Totale</p>
              </div>
              <p className="mt-2 text-2xl font-bold">{0}</p>
              <div className="mt-4">
                <div className="flex justify-between text-sm font-medium">
                  <span>
                    {0 >= 0 ? "+" : ""}
                    {Math.abs(0)}
                  </span>
                  <span className={0 >= 0 ? "text-primary" : "text-destructive"}>
                    {0 >= 0 ? "+" : ""}
                    {Number(0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <section>
            <SectionHeader
              title="Le Tue Partecipazioni"
              icon={PieChart}
              iconClassName="text-primary"
              className="px-4 pb-3 pt-5"
            />
            <div className="space-y-3">
              {0 > 0 ? (
                [].map((holding: EnhancedHolding, index: number) => (
                  <div
                    key={holding.id || index}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <p className="text-base font-medium">{holding.symbol}</p>
                          <span className="text-sm font-medium">{holding.currentValue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p>Nessuna partecipazione trovata</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      <BottomNavigation />
    </PageContainer>
  );
}
