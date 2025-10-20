"use client";

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { BudgetCard } from "@/components/budget-card";
import { SectionHeader } from "@/components/section-header";
import { BudgetSectionSkeleton } from './dashboard-skeleton';
import { formatCurrency } from "@/lib/utils";
import type { Budget, User, BudgetPeriod } from "@/lib/types";

interface BudgetSectionProps {
  budgetsByUser: Record<string, {
    user: User;
    budgets: Array<{
      id: string;
      description: string;
      amount: number;
      spent: number;
      remaining: number;
      percentage: number;
      categories: string[];
      transactionCount: number;
    }>;
    activePeriod: BudgetPeriod | undefined;
    periodStart: string | null;
    periodEnd: string | null;
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    overallPercentage: number;
  }>;
  budgets: Budget[];
  selectedViewUserId: string;
  isLoading?: boolean;
}

/**
 * Budget section component with enhanced UX and performance
 * Follows Single Responsibility Principle - only handles budget display
 */
export const BudgetSection = ({
  budgetsByUser,
  budgets,
  selectedViewUserId,
  isLoading
}: BudgetSectionProps) => {
  const router = useRouter();

  if (isLoading) {
    return <BudgetSectionSkeleton />;
  }

  const budgetEntries = Object.values(budgetsByUser);

  if (budgetEntries.length === 0) {
    return (
      <section className="bg-card px-3 pt-3">
        <SectionHeader
          title="Budget"
          subtitle="Monitora le tue spese per categoria"
          className="mb-3"
        />

        <div className="bg-card rounded-2xl p-8 text-center border border-primary/20 shadow-sm">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 mx-auto mb-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">€</span>
            </div>
          </div>
          <h3 className="font-semibold text-primary mb-2">Nessun budget configurato</h3>
          <p className="text-sm text-foreground/70 mb-4 max-w-sm mx-auto">
            Crea dei budget per monitorare le tue spese e tenere sotto controllo le finanze familiari
          </p>
          <button
            onClick={() => router.push('/budgets')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-105"
          >
            Crea Budget
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-card px-4 py-4">
      <SectionHeader
        title="Budget"
        subtitle={`${budgetEntries.length} ${budgetEntries.length === 1 ? 'utente' : 'utenti'} con budget attivi`}
        className="mb-3"
      />

      <div className="space-y-4">
        {budgetEntries
          .sort((a, b) => b.totalBudget - a.totalBudget)
          .map((userBudgetGroup, index) => {
            const {
              user,
              budgets: userBudgets,
              activePeriod,
              periodStart,
              periodEnd,
              totalBudget,
              totalSpent,
              overallPercentage
            } = userBudgetGroup;

            return (
              <div
                key={user.id}
                className="bg-card shadow-sm border border-primary/20 rounded-xl overflow-hidden transform transition-all duration-300 hover:shadow-md hover:shadow-primary/20 hover:scale-[1.01]"
                style={{
                  animationDelay: `${index * 150}ms`,
                }}
              >
                {/* Mobile-First Compact User Header */}
                <div className="bg-card p-3 border-b border-primary/20">
                  {/* User Info Row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm">
                        <span className="text-xs font-bold text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{user.name}</h3>
                        {activePeriod && periodStart && (
                          <div className="text-xs">
                            {new Date(periodStart).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} -{' '}
                            {periodEnd ? new Date(periodEnd).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : 'In corso'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Budget Amount - Right Side */}
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        <span className={overallPercentage > 100 ? 'text-destructive' : 'text-primary'}>
                          {formatCurrency(totalSpent)}
                        </span>
                        <span className="text-primary/50 font-normal"> / </span>
                        <span>{formatCurrency(totalBudget)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar with Inline Percentage */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-primary/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          overallPercentage > 100
                            ? 'bg-destructive'
                            : overallPercentage > 75
                            ? 'bg-warning'
                            : 'bg-accent'
                        }`}
                        style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        overallPercentage > 100
                          ? 'bg-destructive'
                          : overallPercentage > 75
                          ? 'bg-warning'
                          : 'bg-accent'
                      }`} />
                      <span className={`text-xs font-bold ${
                        overallPercentage > 100
                          ? 'text-destructive'
                          : overallPercentage > 75
                          ? 'text-warning'
                          : 'text-accent'
                      }`}>
                        {Math.round(overallPercentage)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* User's Budget Cards */}
                <div className="divide-y divide-primary/10">
                  {userBudgets
                    .sort((a, b) => b.amount - a.amount)
                    .map((budgetInfo, budgetIndex) => {
                      const budget = budgets.find((b: Budget) => b.id === budgetInfo.id);
                      if (!budget) return null;

                      const mappedBudgetInfo = {
                        id: budgetInfo.id,
                        spent: budgetInfo.spent,
                        remaining: budgetInfo.remaining,
                        progress: budgetInfo.percentage
                      };

                      return (
                        <div
                          key={budget.id}
                          className="transform transition-all duration-200 hover:bg-primary/5"
                          style={{
                            animationDelay: `${(index * 150) + (budgetIndex * 100)}ms`,
                          }}
                        >
                          <Suspense fallback={
                            <div className="px-3 py-2 animate-pulse">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-muted rounded-2xl"></div>
                                <div className="flex-1">
                                  <div className="h-4 bg-muted rounded w-24 mb-1"></div>
                                  <div className="h-3 bg-muted rounded w-16"></div>
                                </div>
                                <div className="text-right">
                                  <div className="h-4 bg-muted rounded w-20 mb-1"></div>
                                  <div className="h-3 bg-muted rounded w-12"></div>
                                </div>
                              </div>
                            </div>
                          }>
                            <BudgetCard
                              budget={budget}
                              budgetInfo={mappedBudgetInfo}
                              onClick={() => {
                                const params = new URLSearchParams();
                                params.set('budget', budget.id);
                                if (selectedViewUserId !== 'all') {
                                  params.set('member', selectedViewUserId);
                                }
                                router.push(`/budgets?${params.toString()}`);
                              }}
                            />
                          </Suspense>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
};

export default BudgetSection;
