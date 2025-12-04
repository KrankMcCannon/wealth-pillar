"use client";

import { useMemo } from "react";

/**
 * Custom hook to transform an array into a lookup map
 * Converts array of objects to Record<string, any> for O(1) lookups
 *
 * @template T - Type of array items
 * @param array - Source array to transform
 * @param keyField - Field to use as map key
 * @param valueField - Field to use as map value
 * @returns Record mapping keys to values
 *
 * @example
 * ```tsx
 * const accounts = [
 *   { id: '1', name: 'Checking', type: 'bank' },
 *   { id: '2', name: 'Savings', type: 'bank' }
 * ];
 *
 * // Map id -> name
 * const accountNames = useMapFromArray(accounts, 'id', 'name');
 * // { '1': 'Checking', '2': 'Savings' }
 *
 * // Map id -> type
 * const accountTypes = useMapFromArray(accounts, 'id', 'type');
 * // { '1': 'bank', '2': 'bank' }
 * ```
 */
export function useMapFromArray<T>(
  array: T[],
  keyField: keyof T,
  valueField: keyof T
): Record<string, any> {
  return useMemo(() => {
    const map: Record<string, any> = {};
    array.forEach((item) => {
      const key = String(item[keyField]);
      map[key] = item[valueField];
    });
    return map;
  }, [array, keyField, valueField]);
}

/**
 * Convenience hook for common id -> name mapping pattern
 * Specifically for arrays with { id: string; name: string } structure
 *
 * @template T - Type extending { id: string; name: string }
 * @param array - Array of items with id and name fields
 * @returns Record mapping ids to names
 *
 * @example
 * ```tsx
 * const accounts = [
 *   { id: '1', name: 'Checking' },
 *   { id: '2', name: 'Savings' }
 * ];
 *
 * const accountNames = useIdNameMap(accounts);
 * // { '1': 'Checking', '2': 'Savings' }
 *
 * // Use in JSX
 * <p>Account: {accountNames[transaction.account_id]}</p>
 * ```
 */
export function useIdNameMap<T extends { id: string; name: string }>(
  array: T[]
): Record<string, string> {
  return useMapFromArray(array, 'id', 'name');
}
