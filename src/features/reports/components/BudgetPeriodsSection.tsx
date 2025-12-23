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
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-card/50 rounded-2xl animate-pulse border border-primary/10" />
        ))}
      </div>
    );
  }

  // Empty state
  if (enrichedPeriods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
          <CalendarOff className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-black mb-2">Nessun periodo di budget configurato</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          I periodi di budget vengono creati automaticamente quando imposti la tua data di inizio budget nelle
          impostazioni.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
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
    </div>
  );
}
