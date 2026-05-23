'use client';

import { Account } from '@/lib';
import { BalanceSectionSkeleton } from '@/features/dashboard';
import { TotalBalanceLink } from './total-balance-link';
import { accountStyles } from '../theme/account-styles';

interface BalanceSectionProps {
  accounts: Account[];
  totalBalance: number;
  selectedUserId?: string | undefined;
  isLoading?: boolean | undefined;
}

/**
 * Balance section on the home dashboard.
 * Renders total balance hero linking to the accounts page.
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
