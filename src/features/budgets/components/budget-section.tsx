"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import type { Budget, BudgetPeriod, User } from '@/lib';
import { progressBarVariants } from '@/lib';
import { BudgetSectionSkeleton } from "@/features/dashboard";
import { SectionHeader } from "@/components/layout";
import { PageSection, RowCard } from "@/components/ui/layout";
import { BudgetCard } from "@/components/cards";
import { formatCurrency } from "@/lib/utils/currency-formatter";
import {
  budgetStyles,
  getBudgetSectionProgressStyles,
  getBudgetGroupCardStyle,
  getBudgetSectionProgressBarStyle,
} from "@/styles/system";

interface BudgetSectionProps {
  budgetsByUser: Record<
    string,
    {
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
    }
  >;
  budgets: Budget[];
  selectedViewUserId?: string;
  isLoading?: boolean;
  headerLeading?: React.ReactNode;
}

/**
 * Budget section component with enhanced UX and performance
 * Follows Single Responsibility Principle - only handles budget display
 */
export const BudgetSection = ({
  budgetsByUser,
  budgets,
  selectedViewUserId,
  isLoading,
  headerLeading,
}: BudgetSectionProps) => {
  const router = useRouter();

  // Show skeleton only if actively loading AND no data received yet
  // With placeholderData, empty object exists immediately, so check both conditions
  const allBudgetEntries = Object.values(budgetsByUser);

  // Filter budget entries based on selected user
  // If selectedViewUserId is undefined, show all budgets
  const budgetEntries = selectedViewUserId
    ? allBudgetEntries.filter((entry) => entry.user.id === selectedViewUserId)
    : allBudgetEntries;

  const isInitialLoading = isLoading && budgetEntries.length === 0;

  if (isInitialLoading) {
    return <BudgetSectionSkeleton />;
  }

  if (budgetEntries.length === 0) {
    return (
      <PageSection className={budgetStyles.section.container}>
        <SectionHeader title="Budget" subtitle="Monitora le tue spese per categoria" />

        <div className={budgetStyles.section.emptyContainer}>
          <div className={budgetStyles.section.emptyIconWrap}>
            <div className={budgetStyles.section.emptyIconInner}>
              <span className={budgetStyles.section.emptyIconText}>€</span>
            </div>
          </div>
          <h3 className={budgetStyles.section.emptyTitle}>Nessun budget configurato</h3>
          <p className={budgetStyles.section.emptyDescription}>
            Crea dei budget per monitorare le tue spese e tenere sotto controllo le finanze familiari
          </p>
          <button
            onClick={() => router.push("/budgets")}
            className={budgetStyles.section.emptyButton}
          >
            Crea Budget
          </button>
        </div>
      </PageSection>
    );
  }

  return (
    <PageSection className={budgetStyles.section.container}>
      <SectionHeader
        title="Budget"
        subtitle={budgetEntries.length > 1 ? `${budgetEntries.length} utenti con budget attivi` : undefined}
        leading={headerLeading}
      />

      <div className={budgetStyles.transactions.container}>
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
              totalRemaining,
              overallPercentage,
            } = userBudgetGroup;
            const progressClasses = getBudgetSectionProgressStyles(overallPercentage);

            return (
              <div
                key={user.id}
                className={budgetStyles.section.groupCard}
                style={getBudgetGroupCardStyle(index)}
              >
                {/* Mobile-First Compact User Header */}
                <div
                  className={`${budgetStyles.section.groupHeader} cursor-pointer hover:bg-primary/5 transition-colors`}
                  onClick={() => router.push(`/budgets/summary?userId=${user.id}`)}
                >
                  {/* User Info Row */}
                  <RowCard
                    icon={
                      <span className={budgetStyles.section.avatarText}>
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    }
                    iconClassName={budgetStyles.section.avatar}
                    title={user.name}
                    subtitle={
                      activePeriod && periodStart ? (
                        <span className={budgetStyles.section.periodText}>
                          {new Date(periodStart).toLocaleDateString("it-IT", { day: "numeric", month: "short" })} -{" "}
                          {periodEnd
                            ? new Date(periodEnd).toLocaleDateString("it-IT", { day: "numeric", month: "short" })
                            : "In corso"}
                        </span>
                      ) : undefined
                    }
                    primaryValue={
                      <div className="flex flex-col items-end">
                        <div className={budgetStyles.section.amount}>
                          <span className={`${totalRemaining >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                            {formatCurrency(totalRemaining)}
                          </span>
                          <span className={budgetStyles.section.amountDivider}> / </span>
                          <span>{formatCurrency(totalBudget)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Spesi: {formatCurrency(totalSpent)}
                        </span>
                      </div>
                    }
                    rightLayout="row"
                  />

                  {/* Progress Bar with Inline Percentage */}
                  <div className={budgetStyles.section.progressRow}>
                    <div
                      className={progressBarVariants({
                        status: overallPercentage > 100 ? "danger" : overallPercentage > 75 ? "warning" : "neutral",
                      })}
                    >
                      <div
                        className={`${budgetStyles.progress.barFillBase} ${progressClasses.bar}`}
                        style={getBudgetSectionProgressBarStyle(overallPercentage)}
                      />
                    </div>
                    <div className={budgetStyles.section.progressBadge}>
                      <div className={`${budgetStyles.section.progressBadgeDot} ${progressClasses.dot}`} />
                      <span
                        className={`${budgetStyles.section.progressBadgeText} ${progressClasses.text}`}
                      >
                        {Math.round(overallPercentage)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* User's Budget Cards */}
                <div className={budgetStyles.section.cardsDivider}>
                  {userBudgets
                    .sort((a, b) => b.amount - a.amount)
                    .map((budgetInfo) => {
                      const budget = budgets.find((b: Budget) => b.id === budgetInfo.id);
                      if (!budget) return null;

                      const mappedBudgetInfo = {
                        id: budgetInfo.id,
                        spent: budgetInfo.spent,
                        remaining: budgetInfo.remaining,
                        progress: budgetInfo.percentage,
                      };

                      return (
                        <Suspense
                          key={budget.id}
                          fallback={
                            <div className={budgetStyles.section.cardSkeleton}>
                              <div className={budgetStyles.section.cardSkeletonRow}>
                                <div className={budgetStyles.section.cardSkeletonIcon}></div>
                                <div className={budgetStyles.section.cardSkeletonBody}>
                                  <div className={budgetStyles.section.cardSkeletonTitle}></div>
                                  <div className={budgetStyles.section.cardSkeletonSubtitle}></div>
                                </div>
                                <div className={budgetStyles.section.cardSkeletonRight}>
                                  <div className={budgetStyles.section.cardSkeletonAmount}></div>
                                  <div className={budgetStyles.section.cardSkeletonSubAmount}></div>
                                </div>
                              </div>
                            </div>
                          }
                        >
                          <BudgetCard
                            budget={budget}
                            budgetInfo={mappedBudgetInfo}
                            onClick={() => {
                              const params = new URLSearchParams();
                              params.set("budget", budget.id);
                              // Always pass the budget owner's user_id
                              params.set("member", budget.user_id);
                              router.push(`/budgets?${params.toString()}`);
                            }}
                          />
                        </Suspense>
                      );
                    })}
                </div>
              </div>
            );
          })}
      </div>
    </PageSection>
  );
};

export default BudgetSection;
