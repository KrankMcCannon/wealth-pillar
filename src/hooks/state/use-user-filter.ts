"use client";

/**
 * Global User Filter Hook
 * Provides access to global user selection state (persisted across pages via localStorage)
 *
 * This hook delegates to UserFilterContext for global state management.
 * User selection persists across page navigation and browser refreshes.
 *
 * @example
 * ```tsx
 * const { selectedGroupFilter, setSelectedGroupFilter, selectedUserId } = useUserFilter();
 *
 * // selectedGroupFilter: "all" | user_id
 * // selectedUserId: undefined | user_id
 * ```
 */
export { useUserFilterContext as useUserFilter } from '@/contexts';
