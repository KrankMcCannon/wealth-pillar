'use client';

import { Account } from '@/lib';
import { BalanceSectionSkeleton } from '@/features/dashboard';
import { TotalBalanceLink } from './TotalBalanceLink';
import { accountStyles } from '../theme/account-styles';

interface BalanceSectionProps {
  accounts: Account[];
  totalBalance: number;
  selectedUserId?: string | undefined;
  isLoading?: boolean | undefined;
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
  totalBalance,
  selectedUserId,
  isLoading = false,
}: BalanceSectionProps) => {
  const isInitialLoading = isLoading && (!accounts || accounts.length === 0);

  if (isInitialLoading) {
    return <BalanceSectionSkeleton />;
  }

  return (
    <section className={accountStyles.balanceSection.container}>
      <TotalBalanceLink
        embedded={false}
        totalBalance={totalBalance}
        selectedUserId={selectedUserId}
      />
    </section>
  );
};

export default BalanceSection;
