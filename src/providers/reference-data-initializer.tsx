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
 *
 * Usage in layout.tsx:
 * ```tsx
 * <ReferenceDataInitializer data={{ currentUser, groupUsers, accounts, categories }}>
 *   <ModalProvider>
 *     {children}
 *   </ModalProvider>
 * </ReferenceDataInitializer>
 * ```
 */
export function ReferenceDataInitializer({
  children,
  data,
}: Readonly<ReferenceDataInitializerProps>) {
  const initialize = useReferenceDataStore((state) => state.initialize);
  const isInitialized = useReferenceDataStore((state) => state.isInitialized);

  // Initialize synchronously using useMemo to ensure store is ready before children render
  // This prevents the "currentUser is null" error when child components try to access the store
  const isReady = useMemo(() => {
    if (!isInitialized && data) {
      initialize(data);
      return true;
    }
    return isInitialized;
  }, [data, initialize, isInitialized]);

  // Don't render children until store is initialized
  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
