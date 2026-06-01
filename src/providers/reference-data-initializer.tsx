/**
 * Reference Data Initializer
 *
 * Client component that initializes the reference data store with data from server components.
 * This bridges the gap between Server Components (which fetch data) and Client Components (which use stores).
 *
 * @module providers/reference-data-initializer
 */

'use client';

import { useMemo } from 'react';
import { useReferenceDataStore } from '@/stores/reference-data-store';
import type { Account, Category } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

interface ReferenceDataInitializerProps {
  children: React.ReactNode;
  data: {
    accounts: Account[];
    categories: Category[];
    usedCategoryKeys?: string[];
  };
}

// ============================================================================
// Component
// ============================================================================

/**
 * ReferenceDataInitializer
 *
 * Initializes the reference data store with server data on mount.
 * Prevents re-initialization on re-renders.
 */
export function ReferenceDataInitializer({
  children,
  data,
}: Readonly<ReferenceDataInitializerProps>) {
  const initialize = useReferenceDataStore((state) => state.initialize);
  const isInitialized = useReferenceDataStore((state) => state.isInitialized);

  const isReady = useMemo(() => {
    if (!isInitialized && data) {
      initialize(data);
      return true;
    }
    return isInitialized;
  }, [data, initialize, isInitialized]);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
