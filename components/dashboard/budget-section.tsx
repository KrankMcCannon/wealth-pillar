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
      <section className="bg-[#F8FAFC] px-3 pt-3">
        <SectionHeader
          title="Budget"
          subtitle="Monitora le tue spese per categoria"
          className="mb-3"
        />

        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/60 shadow-sm">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7578EC]/10 to-[#7578EC]/5 mx-auto mb-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-[#7578EC]/20 flex items-center justify-center">
              <span className="text-[#7578EC] font-bold text-lg">€</span>
            </div>
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Nessun budget configurato</h3>
          <p className="text-sm text-slate-600 mb-4 max-w-sm mx-auto">
            Crea dei budget per monitorare le tue spese e tenere sotto controllo le finanze familiari
          </p>
          <button
            onClick={() => router.push('/budgets')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7578EC] to-[#6366F1] text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-[#7578EC]/25 transition-all duration-300 hover:scale-105"
          >
            Crea Budget
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#F8FAFC] px-4 py-4">
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
                className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden transform transition-all duration-300 hover:shadow-md hover:shadow-slate-200/50 hover:scale-[1.01]"
                style={{
                  animationDelay: `${index * 150}ms`,
                }}
              >
                {/* Mobile-First Compact User Header */}
                <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 p-3 border-b border-gray-200">
                  {/* User Info Row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#7578EC]/10 to-[#7578EC]/5 shadow-sm">
                        <span className="text-xs font-bold text-[#7578EC]">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{user.name}</h3>
                        {activePeriod && periodStart && (
                          <div className="text-xs text-slate-500">
                            {new Date(periodStart).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} -{' '}
                            {periodEnd ? new Date(periodEnd).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : 'In corso'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Budget Amount - Right Side */}
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        <span className={overallPercentage > 100 ? 'text-red-600' : 'text-slate-900'}>
                          {formatCurrency(totalSpent)}
                        </span>
                        <span className="text-slate-400 font-normal"> / </span>
                        <span className="text-slate-600">{formatCurrency(totalBudget)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar with Inline Percentage */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          overallPercentage > 100
                            ? 'bg-gradient-to-r from-red-500 to-red-600'
                            : overallPercentage > 75
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                            : 'bg-gradient-to-r from-green-400 to-green-500'
                        }`}
                        style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100/80">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        overallPercentage > 100
                          ? 'bg-rose-500'
                          : overallPercentage > 75
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`} />
                      <span className={`text-xs font-bold ${
                        overallPercentage > 100
                          ? 'text-rose-600'
                          : overallPercentage > 75
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}>
                        {Math.round(overallPercentage)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* User's Budget Cards */}
                <div className="divide-y divide-gray-100">
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
                          className="transform transition-all duration-200 hover:bg-slate-50/50"
                          style={{
                            animationDelay: `${(index * 150) + (budgetIndex * 100)}ms`,
                          }}
                        >
                          <Suspense fallback={
                            <div className="px-3 py-2 animate-pulse">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-slate-200 rounded-2xl"></div>
                                <div className="flex-1">
                                  <div className="h-4 bg-slate-200 rounded w-24 mb-1"></div>
                                  <div className="h-3 bg-slate-200 rounded w-16"></div>
                                </div>
                                <div className="text-right">
                                  <div className="h-4 bg-slate-200 rounded w-20 mb-1"></div>
                                  <div className="h-3 bg-slate-200 rounded w-12"></div>
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