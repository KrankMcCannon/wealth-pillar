"use client";

import { useUserFilterStore } from '@/stores/user-filter-store';

/**
 * Global User Filter Hook
 * Provides access to global user selection state (persisted across pages via localStorage)
 *
 * Now uses Zustand for non-blocking state management instead of Context API.
 * User selection persists across page navigation and browser refreshes via localStorage.
 *
 * @example
 * ```tsx
 * const { selectedGroupFilter, setSelectedGroupFilter, selectedUserId } = useUserFilter();
 *
 * // selectedGroupFilter: "all" | user_id
 * // selectedUserId: undefined | user_id
 * ```
 */
export function useUserFilter() {
  const selectedGroupFilter = useUserFilterStore(state => state.selectedGroupFilter);
  const selectedUserId = useUserFilterStore(state => state.selectedUserId);
  const setSelectedGroupFilter = useUserFilterStore(state => state.setSelectedGroupFilter);
  const reset = useUserFilterStore(state => state.reset);

  return {
    selectedGroupFilter,
    selectedUserId,
    setSelectedGroupFilter,
    reset,
  };
}
