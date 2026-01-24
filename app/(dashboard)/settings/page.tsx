/**
 * Settings Page - Server Component
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/cached-auth";
import { AccountService, TransactionService } from "@/server/services";
import SettingsContent from "./settings-content";
import { PageLoader } from "@/components/shared";

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth");

  // Fetch accounts and transactions
  // Fetch counts
  const [accountCount, transactionCount] = await Promise.all([
    AccountService.getAccountCountByUser(currentUser.id),
    TransactionService.getTransactionCountByUser(currentUser.id)
  ]);

  return (
    <Suspense fallback={<PageLoader message="Caricamento impostazioni..." />}>
      <SettingsContent
        accountCount={accountCount}
        transactionCount={transactionCount}
      />
    </Suspense>
  );
}
