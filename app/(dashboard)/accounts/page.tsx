/**
 * Accounts Page - Server Component
 */

import { Suspense } from "react";
import { getDashboardData } from "@/lib/auth/get-dashboard-data";
import { PageDataService } from "@/server/services";
import AccountsContent from "./accounts-content";
import { AccountHeaderSkeleton } from "@/features/accounts/components/account-skeletons";

export default async function AccountsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  // Fetch accounts page data and categories in parallel
  const { data, error } = await PageDataService.getAccountsPageData(currentUser.group_id || '');

  if (error) {
    console.error("Failed to fetch accounts page data:", error);
  }

  const { accountBalances = {}, accounts = [] } = data || {};

  return (
    <Suspense fallback={<AccountHeaderSkeleton />}>
      <AccountsContent
        accountBalances={accountBalances}
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
      />
    </Suspense>
  );
}
