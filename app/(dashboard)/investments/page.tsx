/**
 * Investments Page - Server Component
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { AccountService, CategoryService } from "@/lib/services";
import InvestmentsContent from './investments-content';
import { PageLoader } from '@/src/components/shared';

export default async function InvestmentsPage() {
  const { currentUser, groupUsers } = await getDashboardData();
  const [accountsResult, categoriesResult] = await Promise.all([
    AccountService.getAccountsByUser(currentUser.id),
    CategoryService.getAllCategories(),
  ]);

  const accounts = accountsResult.data || [];
  const categories = categoriesResult.data || [];

  return (
    <Suspense fallback={<PageLoader message="Caricamento investimenti..." />}>
      <InvestmentsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
        categories={categories}
      />
    </Suspense>
  );
}
