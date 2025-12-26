/**
 * Reference Data Initializer
 *
 * Client component that initializes the reference data store with data from server components.
 * This bridges the gap between Server Components (which fetch data) and Client Components (which use stores).
 *
 * @module providers/reference-data-initializer
 */

"use client";

import { useEffect, useRef } from 'react';
import { useReferenceDataStore } from '@/stores/reference-data-store';
import type { User, Account, Category } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

interface ReferenceDataInitializerProps {
  children: React.ReactNode;
  data: {
    currentUser: User;
    groupUsers: User[];
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
}: ReferenceDataInitializerProps) {
  const initialize = useReferenceDataStore((state) => state.initialize);
  const isInitialized = useReferenceDataStore((state) => state.isInitialized);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (!hasInitialized.current && !isInitialized && data) {
      initialize(data);
      hasInitialized.current = true;
    }
  }, [data, initialize, isInitialized]);

  return <>{children}</>;
}
