/**
 * BudgetPeriodsSection Component
 * Container for displaying all budget periods with metrics
 */

"use client";

import { useMemo, useState, useCallback } from "react";
import { BudgetPeriodCard } from "./BudgetPeriodCard";
import type { User, Transaction, Account, Category } from "@/lib/types";
import type { EnrichedBudgetPeriod } from "@/server/services/report-period.service";
import { CalendarOff, ChevronDown } from "lucide-react";
import { toDateTime } from "@/lib/utils";
import { ListContainer, PageSection } from "@/components/ui";
import { reportsStyles } from "@/styles/system";
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
  // Track which periods are expanded
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());
  // Track how many periods are visible (for load more)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  // Filter periods by user if needed (though passed activeBudgetPeriods should already be filtered?)
  // ReportsContent passes activeBudgetPeriods which IS filtered by user.
  // So we just use it directly. Assuming enrichedBudgetPeriods passed IS the active/filtered list.

  // Sort by start_date descending (most recent first) - Server might have sorted but let's ensure
  // Actually ReportsContent filters it.

  // Use passed periods directly
  const enrichedPeriods = enrichedBudgetPeriods;
  // Sorting is done in ReportsContent or parent? 
  // Let's sort here to be safe if not sorted
  // enrichedPeriods.sort(...) -> Mutation? better copy or assume sorted?
  // ReportsContent filters it, preserving order if original was sorted.
  // PageDataService doesn't explicitly sort enriched periods after mapping?
  // ReportPeriodService.enrichBudgetPeriods sorts? "Sort by Start Date Ascending" inside specific user logic.
  // But flattened list might be mixed.
  // ReportsContent filters `userFilteredBudgetPeriods`. `useFilteredData` preserves order?
  // Let's sort to be safe: Descending.

  const sortedPeriods = useMemo(() => {
    return [...enrichedPeriods].sort((a, b) => {
      const dateA = toDateTime(a.start_date)?.toMillis() || 0;
      const dateB = toDateTime(b.start_date)?.toMillis() || 0;
      return dateB - dateA;
    });
  }, [enrichedPeriods]);

  // Get visible periods subset
  const visiblePeriods = useMemo(() => {
    return sortedPeriods.slice(0, visibleCount);
  }, [sortedPeriods, visibleCount]);

  const hasMore = visibleCount < sortedPeriods.length;

  // Load more handler
  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => prev + LOAD_MORE_COUNT);
  }, []);

  // Toggle period expansion
  const togglePeriod = (periodId: string) => {
    setExpandedPeriods((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(periodId)) {
        newSet.delete(periodId);
      } else {
        newSet.add(periodId);
      }
      return newSet;
    });
  };

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
  if (enrichedPeriods.length === 0) {
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
    <div className="flex flex-col gap-4">
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
            isExpanded={expandedPeriods.has(period.id)}
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
          Carica altri ({sortedPeriods.length - visibleCount} rimanenti)
        </Button>
      )}
    </div>
  );
}
