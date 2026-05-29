'use client';

import { TotalBalanceLink } from './total-balance-link';
import { accountStyles } from '../theme/account-styles';

interface BalanceSectionProps {
  spendableBalance: number;
  reserveBalance?: number;
  selectedUserId?: string | undefined;
}

/**
 * Balance section on the home dashboard.
 * Renders spendable balance hero linking to the accounts page.
 */
export const BalanceSection = ({
  spendableBalance,
  reserveBalance = 0,
  selectedUserId,
}: BalanceSectionProps) => {
  return (
    <section className={accountStyles.balanceSection.container}>
      <TotalBalanceLink
        embedded={false}
        spendableBalance={spendableBalance}
        reserveBalance={reserveBalance}
        selectedUserId={selectedUserId}
      />
    </section>
  );
};

export default BalanceSection;
