'use client';

import { useLayoutEffect } from 'react';
import { useReferenceDataStore } from '@/stores/reference-data-store';
import type { Account, Category } from '@/lib/types';

interface ReferenceDataInitializerProps {
  children: React.ReactNode;
  data: {
    accounts: Account[];
    categories: Category[];
    usedCategoryKeys?: string[];
  };
}

/** Apply each authoritative server snapshot before painting its consumers. */
export function ReferenceDataInitializer({
  children,
  data,
}: Readonly<ReferenceDataInitializerProps>) {
  const initialize = useReferenceDataStore((state) => state.initialize);
  useLayoutEffect(() => {
    // A previous empty/partial load must not permanently block later catalogs.
    // initialize reconciles balances by version and retains pending mutations.
    initialize(data);
  }, [data, initialize]);
  return <>{children}</>;
}
