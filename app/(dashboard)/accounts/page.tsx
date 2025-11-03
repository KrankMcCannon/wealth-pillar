'use client';

/**
 * Accounts Page
 * Simple client component wrapper for loading skeleton and content
 *
 * All data fetching happens client-side with parallel execution
 * Loading skeleton displayed immediately for fast perceived performance
 */

import { Suspense } from 'react';
import AccountsContent from './accounts-content';
import { AccountHeaderSkeleton } from '@/features/accounts/components/account-skeletons';

export default function AccountsPage() {
  return (
    <Suspense fallback={<AccountHeaderSkeleton />}>
      <AccountsContent />
    </Suspense>
  );
}
