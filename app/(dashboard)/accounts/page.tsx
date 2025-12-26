/**
 * Accounts Page - Server Component
 */

import { Suspense } from "react";
import { getDashboardData } from "@/lib/auth/get-dashboard-data";
import { PageDataService, CategoryService } from "@/lib/services";
import AccountsContent from "./accounts-content";
import { AccountHeaderSkeleton } from "@/features/accounts/components/account-skeletons";

interface AccountsPageProps {
  searchParams: Promise<{ userId?: string }>;
}

export default async function AccountsPage(props: AccountsPageProps) {
  const { currentUser } = await getDashboardData();

  // Await searchParams for Next.js 15
  const searchParams = await props.searchParams;
  const filterUserId = searchParams?.userId;

  // Fetch accounts page data and categories in parallel
  const [{ data: pageData, error }, { data: categoriesData }] = await Promise.all([
    PageDataService.getAccountsPageData(currentUser.group_id),
    CategoryService.getAllCategories(),
  ]);

  const data = pageData;
  const categories = categoriesData || [];

  if (error) {
    console.error("Failed to fetch accounts page data:", error);
  }

  const accounts = data?.accounts || [];
  const accountBalances = data?.accountBalances || {};

  return (
    <Suspense fallback={<AccountHeaderSkeleton />}>
      <AccountsContent
        accounts={accounts}
        accountBalances={accountBalances}
        initialUserId={filterUserId}
        categories={categories}
      />
    </Suspense>
  );
}
