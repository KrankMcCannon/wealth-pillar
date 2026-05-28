'use client';

import { Account } from '@/lib';
import { BalanceSectionSkeleton } from '@/features/dashboard';
import { TotalBalanceLink } from './total-balance-link';
import { accountStyles } from '../theme/account-styles';
import type { NetSavingsResult } from '@/server/use-cases/shared/savings.logic';

interface BalanceSectionProps {
  accounts: Account[];
  spendableBalance: number;
  reserveBalance?: number;
  netSavings?: NetSavingsResult;
  selectedUserId?: string | undefined;
  isLoading?: boolean | undefined;
}

/**
 * Balance section on the home dashboard.
 * Renders spendable balance hero linking to the accounts page.
 */
export const BalanceSection = ({
  accounts,
  spendableBalance,
  reserveBalance = 0,
  netSavings,
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
        spendableBalance={spendableBalance}
        reserveBalance={reserveBalance}
        {...(netSavings !== undefined ? { netSavings } : {})}
        selectedUserId={selectedUserId}
      />
    </section>
  );
};

export default BalanceSection;
