/**
 * TotalBalanceCard Component
 * Displays total balance with account statistics
 */

"use client";

import { CreditCard, TrendingUp, TrendingDown } from "lucide-react";
import { accountStyles } from "../theme/account-styles";
import { formatCurrency } from "@/lib/utils";

const shimmerBase =
  "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

/**
 * Skeleton for balance card
 */
function TotalBalanceCardSkeleton() {
  return (
    <div className={accountStyles.balanceCard.container}>
      <div className={`${accountStyles.balanceCard.card} ${shimmerBase}`}>
        {/* Header */}
        <div className={accountStyles.balanceCard.header}>
          <div>
            <div className="h-3 w-20 bg-muted rounded mb-2" />
            <div className="h-8 w-32 bg-muted rounded" />
          </div>
          <div className="w-14 h-14 bg-muted rounded-full" />
        </div>

        {/* Statistics grid */}
        <div className={accountStyles.balanceCard.statsGrid}>
          {new Array(3).fill(null).map((_, i) => (
            <div key={i} className="bg-primary/5 rounded-lg p-3 border border-primary/10 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-muted rounded" />
                <div className="h-2 w-12 bg-muted rounded" />
              </div>
              <div className="h-5 w-8 bg-muted rounded" />
            </div>
          ))}
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
        {/* Header with balance and icon */}
        <div className={accountStyles.balanceCard.header}>
          <div>
            <p className={accountStyles.balanceCard.label}>Saldo Totale</p>
            <p
              className={isPositive ? accountStyles.balanceCard.valuePositive : accountStyles.balanceCard.valueNegative}
            >
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
            <p className={`${accountStyles.balanceCard.statValue} text-primary`}>{totalAccounts}</p>
          </div>

          {/* Positive Accounts */}
          <div className={accountStyles.balanceCard.statItem.success}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-success" />
              <p className={accountStyles.balanceCard.statLabel}>Positivi</p>
            </div>
            <p className={`${accountStyles.balanceCard.statValue} text-success`}>{positiveAccounts}</p>
          </div>

          {/* Negative Accounts */}
          <div className={accountStyles.balanceCard.statItem.destructive}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <p className={accountStyles.balanceCard.statLabel}>Negativi</p>
            </div>
            <p className={`${accountStyles.balanceCard.statValue} text-destructive`}>{negativeAccounts}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalBalanceCard;
