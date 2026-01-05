"use client";

import { PageContainer, Header, SectionHeader, BottomNavigation } from "@/src/components/layout";
import { EmptyState } from "@/components/shared";
import UserSelector from "@/src/components/shared/user-selector";
import { EnhancedHolding, User } from "@/src/lib";
import { PieChart } from "lucide-react";

interface InvestmentsContentProps {
  currentUser: User;
  groupUsers: User[];
}

export default function InvestmentsContent({
  currentUser,
  groupUsers,
}: InvestmentsContentProps) {
  return (
    <PageContainer className="bg-[#F8FAFC]">
      <div className="flex-1">
        <Header
          title="Investimenti"
          showBack={true}
          className="shadow-sm"
          currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
          showActions={true}
        />

        <UserSelector
          currentUser={currentUser}
          users={groupUsers}
        />

        <main className="p-4 pb-14">
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 mb-6">
            <div className="flex w-64 shrink-0 flex-col rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-base font-bold">Portafoglio Totale</p>
              </div>
              <p className="mt-2 text-2xl font-bold">{0}</p>
              <div className="mt-4">
                <div className="flex justify-between text-sm font-medium">
                  <span>
                    +
                    {Math.abs(0)}
                  </span>
                  <span className="text-primary">
                    +
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
              {true ? (
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
                <EmptyState
                  icon={PieChart}
                  title="Nessuna Partecipazione"
                  description="Non ci sono partecipazioni registrate al momento"
                />
              )}
            </div>
          </section>
        </main>
      </div>

      <BottomNavigation />
    </PageContainer>
  );
}
