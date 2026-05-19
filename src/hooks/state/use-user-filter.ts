'use client';

import { useUserFilterQuery } from '@/lib/navigation/url-state';

/**
 * Global user filter backed by URL `?user=` (nuqs).
 */
export function useUserFilter() {
  return useUserFilterQuery();
}
