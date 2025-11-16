/**
 * Accounts Page - Server Component
 * Uses shared utility for consistent data fetching across all dashboard pages
 */

import { Suspense } from "react";
import { getDashboardData } from "@/lib/auth/get-dashboard-data";
import { AccountService, TransactionService } from "@/lib/services";
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

  // Fetch all group accounts (cached for 5 minutes)
  const { data: allAccounts, error: accountsError } = await AccountService.getAccountsByGroup(currentUser.group_id);

  if (accountsError) {
    console.error("Failed to fetch accounts:", accountsError);
  }

  // Filter accounts based on userId query parameter
  let accounts = allAccounts || [];

  if (filterUserId) {
    // Show accounts for specific user + "Risparmi Casa" account
    const userAccounts = AccountService.filterAccountsByUser(accounts, filterUserId);
    const risparmiCasaAccount = accounts.find((a) => a.name === "Risparmi Casa");

    // Combine user accounts with Risparmi Casa (avoid duplicates)
    accounts =
      risparmiCasaAccount && !userAccounts.find((a) => a.id === risparmiCasaAccount.id)
        ? [...userAccounts, risparmiCasaAccount]
        : userAccounts;
  }

  // Fetch transactions for group to calculate balances (cached for 2 minutes)
  const { data: transactions, error: transactionsError } = await TransactionService.getTransactionsByGroup(
    currentUser.group_id
  );

  if (transactionsError) {
    console.error("Failed to fetch transactions:", transactionsError);
  }

  // Calculate balances for all accounts
  const accountIds = accounts.map((account) => account.id);
  const accountBalances = AccountService.calculateAccountBalances(accountIds, transactions || []);

  return (
    <Suspense fallback={<AccountHeaderSkeleton />}>
      <AccountsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
        accountBalances={accountBalances}
      />
    </Suspense>
  );
}
