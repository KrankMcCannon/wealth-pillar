/**
 * AccountSlider Component
 * Displays horizontal scrollable list of default accounts
 * Used in dashboard balance section
 */

'use client';

import { CreditCard } from 'lucide-react';
import { useRef } from 'react';
import { Account } from '@/lib';
import { AccountSliderCard } from './AccountSliderCard';
import { accountStyles } from '../theme/account-styles';

interface AccountSliderProps {
  accounts: Account[];
  accountBalances: Record<string, number>;
  onAccountClick: (accountId: string) => void;
}

export const AccountSlider = ({
  accounts,
  accountBalances,
  onAccountClick,
}: AccountSliderProps) => {
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    sliderRef.current.scrollLeft += event.deltaY;
  };

  return (
    <div
      ref={sliderRef}
      className={accountStyles.slider.container}
      style={accountStyles.slider.scrollStyle}
      onWheel={handleWheel}
    >
      <div className={accountStyles.slider.inner} style={accountStyles.slider.innerStyle}>
        {accounts.map((account, index) => {
          const accountBalance = accountBalances[account.id] || 0;

          return (
            <AccountSliderCard
              key={account.id}
              account={account}
              balance={accountBalance}
              index={index}
              onClick={() => onAccountClick(account.id)}
            />
          );
        })}

        {/* Add Account Placeholder */}
        {accounts.length === 0 && (
          <div className={accountStyles.slider.addPlaceholder}>
            <div className={accountStyles.slider.addPlaceholderContent}>
              <CreditCard className={accountStyles.slider.addPromptIcon} />
              <p className={accountStyles.slider.addPromptLabel}>
                Aggiungi Account
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSlider;
