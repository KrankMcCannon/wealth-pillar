/**
 * TotalBalanceCard Component
 * Displays total balance with account statistics
 */

'use client';

import { CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib';
import { accountStyles } from '../theme/account-styles';

interface TotalBalanceCardProps {
  totalBalance: number;
  totalAccounts: number;
  positiveAccounts: number;
  negativeAccounts: number;
}

export const TotalBalanceCard = ({
  totalBalance,
  totalAccounts,
  positiveAccounts,
  negativeAccounts,
}: TotalBalanceCardProps) => {
  const isPositive = totalBalance >= 0;

  return (
    <div className={accountStyles.balanceCard.container}>
      <div className={accountStyles.balanceCard.card}>
        {/* Header with balance and icon */}
        <div className={accountStyles.balanceCard.header}>
          <div>
            <p className={accountStyles.balanceCard.label}>Saldo Totale</p>
            <p className={isPositive ? accountStyles.balanceCard.valuePositive : accountStyles.balanceCard.valueNegative}>
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className={accountStyles.balanceCard.iconContainer}>
            <CreditCard className="w-7 h-7 text-primary" />
          </div>
        </div>

        {/* Statistics Grid */}
        <div className={accountStyles.balanceCard.statsGrid}>
          {/* Total Accounts */}
          <div className={accountStyles.balanceCard.statItem.primary}>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-primary" />
              <p className={accountStyles.balanceCard.statLabel}>Totale</p>
            </div>
            <p className={`${accountStyles.balanceCard.statValue} text-primary`}>
              {totalAccounts}
            </p>
          </div>

          {/* Positive Accounts */}
          <div className={accountStyles.balanceCard.statItem.success}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-success" />
              <p className={accountStyles.balanceCard.statLabel}>Positivi</p>
            </div>
            <p className={`${accountStyles.balanceCard.statValue} text-success`}>
              {positiveAccounts}
            </p>
          </div>

          {/* Negative Accounts */}
          <div className={accountStyles.balanceCard.statItem.destructive}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <p className={accountStyles.balanceCard.statLabel}>Negativi</p>
            </div>
            <p className={`${accountStyles.balanceCard.statValue} text-destructive`}>
              {negativeAccounts}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalBalanceCard;
