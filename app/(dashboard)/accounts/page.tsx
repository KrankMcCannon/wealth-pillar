/**
 * Accounts Page - Server Component
 */

import { Suspense } from "react";
import { getDashboardData } from "@/lib/auth/get-dashboard-data";
import { PageDataService } from "@/lib/services";
import AccountsContent from "./accounts-content";
import { AccountHeaderSkeleton } from "@/features/accounts/components/account-skeletons";

interface AccountsPageProps {
  searchParams: Promise<{ userId?: string }>;
}

export default async function AccountsPage(props: AccountsPageProps) {
  const { currentUser, groupUsers } = await getDashboardData();

  // Await searchParams for Next.js 15
  const searchParams = await props.searchParams;
  const filterUserId = searchParams?.userId;

  // Fetch accounts page data in parallel with centralized service
  const { data, error } = await PageDataService.getAccountsPageData(currentUser.group_id);

  if (error) {
    console.error("Failed to fetch accounts page data:", error);
  }

  const accounts = data?.accounts || [];
  const accountBalances = data?.accountBalances || {};

  return (
    <Suspense fallback={<AccountHeaderSkeleton />}>
      <AccountsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
        accountBalances={accountBalances}
        initialUserId={filterUserId}
      />
    </Suspense>
  );
}
