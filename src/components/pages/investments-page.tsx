"use client";

import { SectionHeader } from "@/src/components/layout";
import BottomNavigation from "@/src/components/layout/bottom-navigation";
import { PageLoader } from "@/src/components/shared";
import UserSelector from "@/src/components/shared/user-selector";
import { useInvestmentsController } from "@/src/features/dashboard/hooks/use-investments-controller";
import { formatCurrency, EnhancedHolding } from "@/src/lib";
import { PieChart } from "lucide-react";

export function InvestmentsPage() {
  const {
    currentUser,
    selectedViewUserId,
    users,
    portfolioData,
    isLoading,
    updateViewUserId,
    handleBackClick,
  } = useInvestmentsController();

  if (isLoading) {
    return <PageLoader message="Caricamento investimenti..." />;
  }

  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col justify-between overflow-x-hidden" style={{fontFamily: '"Spline Sans", "Noto Sans", sans-serif', backgroundColor: '#F8FAFC'}}>
      <>
      <div>
        <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 p-4 pb-2 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <button
              className="text-[#1F2937] flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-[#EFF2FE] transition-colors"
              onClick={handleBackClick}
            >
              <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
              </svg>
            </button>
            <h1 className="text-[#1F2937] text-xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Investimenti</h1>
            <div className="size-10"></div>
          </div>
        </header>

        <UserSelector
          users={users}
          currentUser={currentUser}
          selectedGroupFilter={selectedViewUserId}
          onGroupFilterChange={updateViewUserId}
        />

        <main className="p-4 pb-24">
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 mb-6">
            <div className="flex w-64 shrink-0 flex-col rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-base font-bold">Portafoglio Totale</p>
              </div>
              <p className="mt-2 text-2xl font-bold">{formatCurrency(portfolioData.totalValue)}</p>
              <div className="mt-4">
                <div className="flex justify-between text-sm font-medium">
                  <span>{portfolioData.gainLoss >= 0 ? '+' : ''}{formatCurrency(Math.abs(portfolioData.gainLoss))}</span>
                  <span className={portfolioData.gainLoss >= 0 ? 'text-primary' : 'text-destructive'}>
                    {portfolioData.gainLoss >= 0 ? '+' : ''}{portfolioData.gainLossPercent.toFixed(1)}%
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
              {portfolioData.holdings.length > 0 ? (
                portfolioData.holdings.map((holding: EnhancedHolding, index: number) => (
                  <div key={holding.id || index} className="flex items-center justify-between gap-4 rounded-2xl bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-base font-medium">{holding.symbol}</p>
                          <span className="text-sm font-medium">{formatCurrency(holding.currentValue)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p>Nessuna partecipazione trovata</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      <BottomNavigation />
      </>
    </div>
  );
}
