'use client';

import { useEffect, useState } from 'react';

/**
 * Hook that debounces a value
 * Returns the debounced value after the specified delay
 *
 * @example
 * ```tsx
 * const [searchValue, setSearchValue] = useState("");
 * const debouncedSearch = useDebouncedValue(searchValue, 300);
 *
 * // debouncedSearch will update 300ms after searchValue stops changing
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
