"use client";

import { Suspense } from "react";
import { Account } from "@/lib";
import { BalanceSectionSkeleton } from "@/features/dashboard";
import { AccountSlider } from "./AccountSlider";
import { TotalBalanceLink } from "./TotalBalanceLink";
import { BalanceSectionSliderSkeleton } from "./account-skeletons";
import { accountStyles } from "../theme/account-styles";

interface BalanceSectionProps {
  accounts: Account[];
  accountBalances: Record<string, number>;
  totalBalance: number;
  totalAccountsCount?: number;
  selectedUserId?: string;
  onAccountClick: (id: string) => void;
  isLoading?: boolean;
}

/**
 * Balance Section Component
 * Displays default accounts slider and total balance link on dashboard
 *
 * Orchestrates multiple sub-components:
 * - AccountSlider: Horizontal scrollable account cards with skeleton while loading
 * - TotalBalanceLink: Clickable total balance card with skeleton while loading
 *
 * Uses view model for business logic:
 * - Filtering default accounts
 * - Sorting by balance
 *
 * Shows internal skeleton while loading - resilient pattern
 */
export const BalanceSection = ({
  accounts,
  accountBalances,
  totalBalance,
  totalAccountsCount,
  selectedUserId,
  onAccountClick,
  isLoading = false,
}: BalanceSectionProps) => {
  const isInitialLoading = isLoading && (!accounts || accounts.length === 0);

  if (isInitialLoading) {
    return <BalanceSectionSkeleton />;
  }

  // Use provided totalAccountsCount or fall back to displayed accounts length
  const accountCount = totalAccountsCount ?? accounts.length;

  return (
    <section className={accountStyles.balanceSection.container}>
      {/* Account Slider Section */}
      <Suspense fallback={<BalanceSectionSliderSkeleton />}>
        <AccountSlider accounts={accounts} accountBalances={accountBalances} onAccountClick={onAccountClick} />
      </Suspense>

      {/* Total Balance Link Section - only show when there are multiple accounts */}
      {accountCount > 1 && (
        <TotalBalanceLink totalBalance={totalBalance} accountCount={accountCount} selectedUserId={selectedUserId} />
      )}
    </section>
  );
};

export default BalanceSection;
