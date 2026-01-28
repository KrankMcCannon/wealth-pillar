/**
 * BudgetPeriodsSection Component
 * Container for displaying all budget periods with metrics
 */

"use client";

import { BudgetPeriodCard } from "./BudgetPeriodCard";
import type { User, Transaction, Account, Category } from "@/lib/types";
import type { EnrichedBudgetPeriod } from "@/server/services/report-period.service";
import { useBudgetPeriods } from "../hooks/useBudgetPeriods";
import { CalendarOff, ChevronDown } from "lucide-react";
import { ListContainer, PageSection } from "@/components/ui";
import { reportsStyles, layoutStyles } from "@/styles/system";
import { Button } from "@/components/ui/button";

const INITIAL_VISIBLE_COUNT = 5;
const LOAD_MORE_COUNT = 5;

export interface BudgetPeriodsSectionProps {
  enrichedBudgetPeriods: (EnrichedBudgetPeriod & { transactionCount?: number })[]; // Use enriched with count
  groupUsers: User[];
  transactions: Transaction[]; // Should be optional/empty
  accounts: Account[];
  categories: Category[];
  selectedUserId: string; // "all" or specific user ID
  isLoading?: boolean;
}

export function BudgetPeriodsSection({
  enrichedBudgetPeriods,
  categories,
  selectedUserId,
  isLoading = false,
}: Readonly<BudgetPeriodsSectionProps>) {
  const {
    visiblePeriods,
    hasMore,
    remainingCount,
    handleLoadMore,
    togglePeriod,
    isExpanded,
    sortedPeriods
  } = useBudgetPeriods({
    periods: enrichedBudgetPeriods,
    initialVisibleCount: INITIAL_VISIBLE_COUNT,
    incrementCount: LOAD_MORE_COUNT
  });

  // Determine if showing all members (to display user names in cards)
  const showUserNames = selectedUserId === "all";

  // Loading state
  if (isLoading) {
    return (
      <PageSection className={reportsStyles.budgetPeriodsSection.loadingContainer}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={reportsStyles.budgetPeriodsSection.loadingCard} />
        ))}
      </PageSection>
    );
  }

  // Empty state
  if (sortedPeriods.length === 0) {
    return (
      <PageSection className={reportsStyles.budgetPeriodsSection.emptyContainer}>
        <div className={reportsStyles.budgetPeriodsSection.emptyIconWrap}>
          <CalendarOff className={reportsStyles.budgetPeriodsSection.emptyIcon} />
        </div>
        <h3 className={reportsStyles.budgetPeriodsSection.emptyTitle}>Nessun periodo di budget configurato</h3>
        <p className={reportsStyles.budgetPeriodsSection.emptyDescription}>
          I periodi di budget vengono creati automaticamente quando imposti la tua data di inizio budget nelle
          impostazioni.
        </p>
      </PageSection>
    );
  }

  return (
    <div className={layoutStyles.section.container}>
      <ListContainer className={reportsStyles.budgetPeriodsSection.list}>
        {visiblePeriods.map((period) => (
          <BudgetPeriodCard
            key={period.id}
            startDate={period.start_date}
            endDate={period.end_date}
            userName={period.userName}
            userId={period.user_id}
            transactions={period.transactions}
            transactionCount={period.transactionCount}
            categories={categories}
            isExpanded={isExpanded(period.id)}
            onToggle={() => togglePeriod(period.id)}
            showUserName={showUserNames}
            defaultAccountStartBalance={period.defaultAccountStartBalance}
            defaultAccountEndBalance={period.defaultAccountEndBalance}
            periodTotalSpent={period.periodTotalSpent}
            periodTotalIncome={period.periodTotalIncome}
            periodTotalTransfers={period.periodTotalTransfers}
          />
        ))}
      </ListContainer>

      {hasMore && (
        <Button
          variant="outline"
          onClick={handleLoadMore}
          className="mx-auto flex items-center gap-2"
        >
          <ChevronDown className="h-4 w-4" />
          Carica altri ({remainingCount} rimanenti)
        </Button>
      )}
    </div>
  );
}
