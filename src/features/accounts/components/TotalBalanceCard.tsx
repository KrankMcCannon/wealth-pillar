/**
 * TotalBalanceCard Component
 * Displays total balance with account statistics
 */

"use client";

import { CreditCard, TrendingUp, TrendingDown } from "lucide-react";
import { accountStyles } from "../theme/account-styles";
import { formatCurrency } from "@/lib/utils";
import { SHIMMER_BASE } from "@/lib/utils/ui-constants";

/**
 * Skeleton for balance card
 */
function TotalBalanceCardSkeleton() {
  return (
    <div className={accountStyles.balanceCard.container}>
      <div className={`${accountStyles.balanceCard.card} ${SHIMMER_BASE}`}>
        {/* Main Column Layout */}
        <div className={accountStyles.balanceCard.mainRow}>
          {/* Row 1: Balance Info (Label + Value) */}
          <div className={accountStyles.balanceCard.header}>
            <div className="h-3 w-16 bg-primary/15 rounded" />
            <div className="h-6 w-24 bg-primary/15 rounded" />
          </div>

          {/* Row 2: Stats Row */}
          <div className={accountStyles.balanceCard.statsGrid}>
            {new Array(3).fill(null).map((_, i) => (
              <div key={i} className="h-8 flex-1 bg-primary/10 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>


      </div>
    </div>
  );
}

interface TotalBalanceCardProps {
  totalBalance: number;
  totalAccounts: number;
  positiveAccounts: number;
  negativeAccounts: number;
  isLoading?: boolean;
}

export const TotalBalanceCard = ({
  totalBalance,
  totalAccounts,
  positiveAccounts,
  negativeAccounts,
  isLoading = false,
}: TotalBalanceCardProps) => {
  if (isLoading) {
    return <TotalBalanceCardSkeleton />;
  }

  const isPositive = totalBalance >= 0;

  return (
    <div className={accountStyles.balanceCard.container}>
      <div className={accountStyles.balanceCard.card}>
        <div className={accountStyles.balanceCard.mainRow}>
          {/* Row 1: Balance Row (Label left, Value right) */}
          <div className={accountStyles.balanceCard.header}>
            <p className={accountStyles.balanceCard.label}>Saldo Totale</p>
            <p
              className={isPositive ? accountStyles.balanceCard.valuePositive : accountStyles.balanceCard.valueNegative}
            >
              {formatCurrency(totalBalance)}
            </p>
          </div>

          {/* Row 2: Statistics Row */}
          <div className={accountStyles.balanceCard.statsGrid}>
            {/* Total Accounts */}
            <div className={`${accountStyles.balanceCard.statItem.base} ${accountStyles.balanceCard.statItem.primary}`}>
              <span className={accountStyles.balanceCard.statLabel}>Totale:</span>
              <span className={accountStyles.balanceCard.statValue}>{totalAccounts}</span>
            </div>

            {/* Positive Accounts */}
            <div className={`${accountStyles.balanceCard.statItem.base} ${accountStyles.balanceCard.statItem.success}`}>
              <span className={accountStyles.balanceCard.statLabel}>Positivi:</span>
              <span className={accountStyles.balanceCard.statValue}>{positiveAccounts}</span>
            </div>

            {/* Negative Accounts */}
            <div className={`${accountStyles.balanceCard.statItem.base} ${accountStyles.balanceCard.statItem.destructive}`}>
              <span className={accountStyles.balanceCard.statLabel}>Negativi:</span>
              <span className={accountStyles.balanceCard.statValue}>{negativeAccounts}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalBalanceCard;
