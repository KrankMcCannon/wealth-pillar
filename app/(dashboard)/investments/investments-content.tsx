"use client";

import { PageContainer, Header, SectionHeader, BottomNavigation } from "@/components/layout";
import { ListContainer, MetricCard, PageSection, RowCard } from "@/components/ui";
import { EmptyState } from "@/components/shared";
import UserSelector from "@/components/shared/user-selector";
import { EnhancedHolding, User } from "@/lib";
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
          <PageSection>
            <MetricCard
              label="Portafoglio Totale"
              value={0}
              description="+0 (+0.0%)"
            />
          </PageSection>

          <PageSection>
            <SectionHeader
              title="Le Tue Partecipazioni"
              icon={PieChart}
              iconClassName="text-primary"
            />
            <ListContainer>
              {true ? (
                [].map((holding: EnhancedHolding, index: number) => (
                  <RowCard
                    key={holding.id || index}
                    title={holding.symbol}
                    primaryValue={holding.currentValue}
                    variant="regular"
                  />
                ))
              ) : (
                <EmptyState
                  icon={PieChart}
                  title="Nessuna Partecipazione"
                  description="Non ci sono partecipazioni registrate al momento"
                />
              )}
            </ListContainer>
          </PageSection>
        </main>
      </div>

      <BottomNavigation />
    </PageContainer>
  );
}
