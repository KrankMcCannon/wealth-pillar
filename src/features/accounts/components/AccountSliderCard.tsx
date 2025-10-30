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

export const AccountSliderCard = ({
  account,
  balance,
  index,
  onClick,
}: AccountSliderCardProps) => {
  return (
    <div
      className={accountStyles.slider.cardWrapper}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      <Suspense
        fallback={
          <div className="shrink-0 w-60 h-24 bg-primary/10 rounded-lg animate-pulse border border-primary/20" />
        }
      >
        <AccountCard
          account={account}
          accountBalance={balance}
          onClick={onClick}
        />
      </Suspense>
    </div>
  );
};

export default AccountSliderCard;
