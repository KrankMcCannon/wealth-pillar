/**
 * TotalBalanceLink Component
 * Displays total balance with account count
 * Clickable to navigate to /accounts page
 * Used in dashboard balance section
 */

"use client";

import { CreditCard, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { accountStyles } from "../theme/account-styles";
import { formatCurrency } from "@/lib/utils";

interface TotalBalanceLinkProps {
  totalBalance: number;
  accountCount: number;
  selectedUserId?: string;
}

export const TotalBalanceLink = ({ totalBalance, accountCount, selectedUserId }: TotalBalanceLinkProps) => {
  const router = useRouter();
  const isPositive = totalBalance >= 0;

  const handleClick = () => {
    // Navigate to accounts page with userId filter if a specific user is selected
    if (selectedUserId) {
      router.push(`/accounts?userId=${selectedUserId}`);
    } else {
      router.push("/accounts");
    }
  };

  return (
    <div className={accountStyles.totalBalanceLink.container} onClick={handleClick}>

      {/* Left Section - Balance Info */}
      <div className={accountStyles.totalBalanceLink.leftSection}>
        <div className={accountStyles.totalBalanceLink.icon}>
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className={accountStyles.totalBalanceLink.label}>Saldo Totale</p>
          <p
            className={
              isPositive ? accountStyles.totalBalanceLink.valuePositive : accountStyles.totalBalanceLink.valueNegative
            }
          >
            {formatCurrency(totalBalance)}
          </p>
        </div>
      </div>

      {/* Right Section - Account Count Badge */}
      <div className={accountStyles.totalBalanceLink.rightSection}>
        <div className={accountStyles.totalBalanceLink.badge}>
          <span className={accountStyles.totalBalanceLink.badgeText}>
            {accountCount} {accountCount === 1 ? "Account" : "Accounts"}
          </span>
        </div>
        <ArrowRight className={accountStyles.totalBalanceLink.arrow} />
      </div>
    </div>
  );
};

export default TotalBalanceLink;
