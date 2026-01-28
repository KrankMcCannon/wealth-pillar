"use client";

import { useMemo, useState } from "react";
import { useUserFilter, useFilteredData, usePermissions } from "@/hooks";
import { FinanceLogicService } from "@/server/services/finance-logic.service";
import { toDateTime } from "@/lib/utils/date-utils";
import type {
  User,
  Account,
  Category,
  CategoryBreakdownItem
} from "@/lib/types";
import type { EnrichedBudgetPeriod } from "@/server/services/report-period.service";

export interface ReportsDataProps {
  accounts: Account[];
  categories: Category[];
  enrichedBudgetPeriods: (EnrichedBudgetPeriod & { transactionCount?: number })[];
  overviewMetrics: Record<string, {
    totalEarned: number;
    totalSpent: number;
    totalTransferred: number;
    totalBalance: number;
  }>;
  annualSpending: Record<string, Record<string, CategoryBreakdownItem[]>>;
  currentUser: User;
  groupUsers: User[];
}

export function useReportsData({
  categories,
  enrichedBudgetPeriods,
  overviewMetrics,
  annualSpending,
  currentUser,
  groupUsers,
}: ReportsDataProps) {
  // Year filtering state management
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(new Date().getFullYear());

  // User filtering state management using shared hook
  const { selectedGroupFilter } = useUserFilter();

  // Permission checks
  const { isMember } = usePermissions({
    currentUser,
    selectedUserId: selectedGroupFilter === "all" ? undefined : selectedGroupFilter,
  });

  // Force members to see only their own data
  const activeGroupFilter = isMember ? currentUser.id : selectedGroupFilter;

  // Extract available years from annualSpending keys
  const availableYears = useMemo(() => {
    // Collect years from all user's annualSpending
    const years = new Set<number>();
    // If filtering by user, assume 'all' key or specific user key contains years
    const data = annualSpending['all'] || {};
    Object.keys(data).forEach(key => {
      const year = Number(key);
      if (!isNaN(year)) {
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [annualSpending]);

  // Filter budget periods by user using the shared hook
  const { filteredData: userFilteredBudgetPeriods } = useFilteredData({
    data: enrichedBudgetPeriods,
    currentUser,
    selectedUserId: activeGroupFilter === "all" ? undefined : activeGroupFilter,
  });

  // Filter budget periods by Year
  const activeBudgetPeriods = useMemo(() => {
    if (selectedYear === 'all') return userFilteredBudgetPeriods;

    return userFilteredBudgetPeriods.filter(period => {
      const dt = toDateTime(period.start_date);
      return dt?.year === selectedYear;
    });
  }, [userFilteredBudgetPeriods, selectedYear]);

  // Select Overview Metrics from Map
  const activeOverviewMetrics = useMemo(() => {
    return overviewMetrics[activeGroupFilter] || overviewMetrics['all'];
  }, [overviewMetrics, activeGroupFilter]);

  // Select Annual Data from Map
  const activeAnnualData = useMemo(() => {
    // Get year map for user
    const userMap = annualSpending[activeGroupFilter] || annualSpending['all'];
    if (selectedYear === 'all') {
      return userMap['all'] || [];
    }
    return userMap[selectedYear.toString()] || [];
  }, [annualSpending, activeGroupFilter, selectedYear]);

  // Prepare categories (static props derived)
  const enrichedCategories = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      label: FinanceLogicService.getCategoryLabel(categories, category.key),
      color: FinanceLogicService.getCategoryColor(categories, category.key),
      icon: FinanceLogicService.getCategoryIcon(categories, category.key),
    }));
  }, [categories]);

  return {
    selectedYear,
    setSelectedYear,
    selectedGroupFilter,
    activeGroupFilter,
    availableYears,
    activeBudgetPeriods,
    activeOverviewMetrics,
    activeAnnualData,
    enrichedCategories,
    currentUser,
    groupUsers,
  };
}
