/**
 * Settings Page - Server Component
 */

import { Suspense } from "react";
import { getDashboardData } from "@/lib/auth/get-dashboard-data";
import { AccountService, TransactionService, CategoryService } from "@/lib/services";
import SettingsContent from "./settings-content";
import { PageLoader } from "@/src/components/shared";

export default async function SettingsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  // Fetch accounts, transactions, and categories
  const [accountsResult, transactionsResult, categoriesResult] = await Promise.all([
    AccountService.getAccountsByUser(currentUser.id),
    TransactionService.getTransactionsByUser(currentUser.id),
    CategoryService.getAllCategories(),
  ]);

  const accounts = accountsResult.data || [];
  const transactions = transactionsResult.data || [];
  const categories = categoriesResult.data || [];

  return (
    <Suspense fallback={<PageLoader message="Caricamento impostazioni..." />}>
      <SettingsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
        transactions={transactions}
        categories={categories}
      />
    </Suspense>
  );
}
