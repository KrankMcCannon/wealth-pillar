"use client";

import { useState, useMemo } from "react";

interface UseUserFilterReturn {
  selectedGroupFilter: string;
  setSelectedGroupFilter: (filter: string) => void;
  selectedUserId: string | undefined;
}

/**
 * Custom hook for managing user filter state
 * Used across dashboard, budgets, reports, and transactions pages
 */
export function useUserFilter(
  initialFilter: string = "all"
): UseUserFilterReturn {
  const [selectedGroupFilter, setSelectedGroupFilter] = useState(initialFilter);

  const selectedUserId = useMemo(
    () => selectedGroupFilter === "all" ? undefined : selectedGroupFilter,
    [selectedGroupFilter]
  );

  return {
    selectedGroupFilter,
    setSelectedGroupFilter,
    selectedUserId,
  };
}
