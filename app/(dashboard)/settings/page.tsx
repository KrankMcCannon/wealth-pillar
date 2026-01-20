/**
 * Settings Page - Server Component
 */

import { Suspense } from "react";
import { getDashboardData } from "@/lib/auth/get-dashboard-data";
import { AccountService, TransactionService } from "@/server/services";
import SettingsContent from "./settings-content";
import { PageLoader } from "@/components/shared";

export default async function SettingsPage() {
  const { currentUser } = await getDashboardData();

  // Fetch accounts and transactions
  const [accounts, transactions] = await Promise.all([
    AccountService.getAccountsByUser(currentUser.id),
    TransactionService.getTransactionsByUser(currentUser.id)
  ]);

  return (
    <Suspense fallback={<PageLoader message="Caricamento impostazioni..." />}>
      <SettingsContent
        accounts={accounts}
        transactions={transactions}
      />
    </Suspense>
  );
}
