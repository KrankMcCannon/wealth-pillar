/**
 * AccountSliderCard Component
 * Individual account card in the dashboard slider
 * Wraps AccountCard with animation and Suspense
 */

'use client';

import { Suspense } from 'react';
import { Account } from '@/lib';
import { AccountCard } from '@/components/cards';
import { accountStyles } from '../theme/account-styles';

interface AccountSliderCardProps {
  account: Account;
  balance: number;
  index: number;
  onClick: () => void;
}

export const AccountSliderCard = ({ account, balance, index, onClick }: AccountSliderCardProps) => {
  return (
    <div
      className={accountStyles.slider.cardWrapper}
      style={accountStyles.slider.cardDelayStyle(index)}
    >
      <Suspense fallback={<div className={accountStyles.slider.skeletonCard} />}>
        <AccountCard
          account={account}
          accountBalance={balance}
          onClick={onClick}
          className={accountStyles.slider.card}
        />
      </Suspense>
    </div>
  );
};

export default AccountSliderCard;
