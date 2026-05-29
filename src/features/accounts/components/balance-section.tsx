'use client';

import { TotalBalanceLink } from './total-balance-link';
import { accountStyles } from '../theme/account-styles';
import type { NetSavingsResult } from '@/server/use-cases/shared/savings.logic';

interface BalanceSectionProps {
  spendableBalance: number;
  reserveBalance?: number;
  netSavings?: NetSavingsResult;
  selectedUserId?: string | undefined;
}

/**
 * Balance section on the home dashboard.
 * Renders spendable balance hero linking to the accounts page.
 */
export const BalanceSection = ({
  spendableBalance,
  reserveBalance = 0,
  netSavings,
  selectedUserId,
}: BalanceSectionProps) => {
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
