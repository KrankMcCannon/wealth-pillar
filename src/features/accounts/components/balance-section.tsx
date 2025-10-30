"use client";

import { Suspense, useMemo } from 'react';
import { Account, User } from '@/src/lib';
import { BalanceSectionSkeleton } from '@/src/features/dashboard';
import { AccountSlider } from './AccountSlider';
import { TotalBalanceLink } from './TotalBalanceLink';
import { BalanceSectionSliderSkeleton } from './account-skeletons';
import { getDefaultAccountsViewModel } from '../services/balance-section-view-model';

interface BalanceSectionProps {
  accounts: Account[];
  users: User[];
  accountBalances: Record<string, number>;
  totalBalance: number;
  onAccountClick: (id: string) => void;
  isLoading?: boolean;
}

/**
 * Balance Section Component
 * Displays default accounts slider and total balance link on dashboard
 *
 * Orchestrates multiple sub-components:
 * - AccountSlider: Horizontal scrollable account cards
 * - TotalBalanceLink: Clickable total balance card
 *
 * Uses view model for business logic:
 * - Filtering default accounts
 * - Sorting by balance
 */
export const BalanceSection = ({
  accounts,
  users,
  accountBalances,
  totalBalance,
  onAccountClick,
  isLoading
}: BalanceSectionProps) => {
  // Create view model with business logic (must be before conditional)
  const viewModel = useMemo(
    () => getDefaultAccountsViewModel(accounts, users, accountBalances),
    [accounts, users, accountBalances]
  );

  // Show skeleton while loading
  if (isLoading) {
    return <BalanceSectionSkeleton />;
  }

  return (
    <section className="bg-card p-4 shadow-sm">
      {/* Account Slider Section */}
      <Suspense fallback={<BalanceSectionSliderSkeleton />}>
        <AccountSlider
          accounts={viewModel.sortedAccounts}
          accountBalances={accountBalances}
          onAccountClick={onAccountClick}
        />
      </Suspense>

      {/* Total Balance Link Section */}
      <TotalBalanceLink
        totalBalance={totalBalance}
        accountCount={accounts.length}
      />
    </section>
  );
};

export default BalanceSection;
