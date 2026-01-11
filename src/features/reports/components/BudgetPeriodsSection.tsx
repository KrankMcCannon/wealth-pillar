/**
 * BudgetPeriodsSection Component
 * Container for displaying all budget periods with metrics
 */

"use client";

import { useMemo, useState } from "react";
import { BudgetPeriodCard } from "./BudgetPeriodCard";
import { ReportPeriodService } from "@/lib/services";
import type { BudgetPeriod, User, Transaction, Account, Category } from "@/lib/types";
import { CalendarOff } from "lucide-react";
import { toDateTime } from "@/lib/utils/date-utils";
import { ListContainer, PageSection } from "@/components/ui";
import { reportsStyles } from "@/styles/system";

export interface BudgetPeriodsSectionProps {
  budgetPeriods: BudgetPeriod[];
  groupUsers: User[];
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  selectedUserId: string; // "all" or specific user ID
  isLoading?: boolean;
}

export function BudgetPeriodsSection({
  budgetPeriods,
  groupUsers,
  transactions,
  accounts,
  categories,
  selectedUserId,
  isLoading = false,
}: Readonly<BudgetPeriodsSectionProps>) {
  // Track which periods are expanded
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());

  // Enrich budget periods with calculated metrics
  const enrichedPeriods = useMemo(() => {
    const enriched = ReportPeriodService.enrichBudgetPeriods(budgetPeriods, groupUsers, transactions, accounts);

    // Sort by start_date descending (most recent first)
    return enriched.sort((a, b) => {
      const dateA = toDateTime(a.start_date)?.toMillis() || 0;
      const dateB = toDateTime(b.start_date)?.toMillis() || 0;
      return dateB - dateA;
    });
  }, [budgetPeriods, groupUsers, transactions, accounts]);

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
    <ListContainer className={reportsStyles.budgetPeriodsSection.list}>
      {enrichedPeriods.map((period) => (
        <BudgetPeriodCard
          key={period.id}
          startDate={period.start_date}
          endDate={period.end_date}
          userName={period.userName}
          userId={period.user_id}
          transactions={period.transactions}
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
  );
}
