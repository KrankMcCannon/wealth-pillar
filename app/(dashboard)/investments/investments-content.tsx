"use client";

import { PageContainer, Header, SectionHeader, BottomNavigation } from "@/components/layout";
import { EmptyState } from "@/components/shared";
import UserSelector from "@/components/shared/user-selector";
import { EnhancedHolding, User } from "@/lib";
import { PieChart } from "lucide-react";
import { investmentsStyles } from "@/features/investments/theme/investments-styles";

interface InvestmentsContentProps {
  currentUser: User;
  groupUsers: User[];
}

export default function InvestmentsContent({
  currentUser,
  groupUsers,
}: InvestmentsContentProps) {
  return (
    <PageContainer className={investmentsStyles.page.container}>
      <div className={investmentsStyles.page.content}>
        <Header
          title="Investimenti"
          showBack={true}
          className={investmentsStyles.header.container}
          currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
          showActions={true}
        />

        <UserSelector
          currentUser={currentUser}
          users={groupUsers}
        />

        <main className={investmentsStyles.main.container}>
          <div className={investmentsStyles.overview.container}>
            <div className={investmentsStyles.overview.card}>
              <div className={investmentsStyles.overview.cardHeader}>
                <p className={investmentsStyles.overview.title}>Portafoglio Totale</p>
              </div>
              <p className={investmentsStyles.overview.value}>{0}</p>
              <div className={investmentsStyles.overview.delta}>
                <div className={investmentsStyles.overview.deltaRow}>
                  <span>
                    +
                    {Math.abs(0)}
                  </span>
                  <span className={investmentsStyles.overview.deltaPositive}>
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
              iconClassName={investmentsStyles.holdings.icon}
              className={investmentsStyles.holdings.sectionHeader}
            />
            <div className={investmentsStyles.holdings.list}>
              {true ? (
                [].map((holding: EnhancedHolding, index: number) => (
                  <div
                    key={holding.id || index}
                    className={investmentsStyles.holdings.item}
                  >
                    <div className={investmentsStyles.holdings.itemRow}>
                      <div className={investmentsStyles.holdings.itemContent}>
                        <div className={investmentsStyles.holdings.itemHeader}>
                          <p className={investmentsStyles.holdings.itemSymbol}>{holding.symbol}</p>
                          <span className={investmentsStyles.holdings.itemValue}>{holding.currentValue}</span>
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
