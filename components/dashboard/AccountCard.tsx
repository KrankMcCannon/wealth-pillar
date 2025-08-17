import { memo } from "react";
import { Card } from "../ui";
import { Account } from "../../types";
import { formatCurrency } from "../../constants";
import { useBreakpoint } from "../../hooks/ui/useResponsive";

/**
 * Props per AccountCard
 */
interface AccountCardProps {
  account: Account;
  balance: number;
  personName?: string;
}

/**
 * Componente AccountCard
 */
export const AccountCard = memo<AccountCardProps>(({ account, balance, personName }) => {
  const { isMobile } = useBreakpoint();

  return (
    <Card className={`${isMobile ? "p-2" : "p-3 sm:p-4 lg:p-6"} overflow-hidden`}>
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold text-gray-500 dark:text-gray-400 ${
                isMobile ? "text-xs" : "text-sm lg:text-base"
              } truncate`}
            >
              {account.name}
            </h3>
            {personName && (
              <p className={`text-blue-400 dark:text-blue-500 truncate ${isMobile ? "text-xs" : "text-xs"}`}>
                {personName}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <p
            className={`font-bold text-gray-800 dark:text-white break-words ${
              isMobile ? "text-lg" : "text-xl sm:text-2xl lg:text-3xl"
            }`}
          >
            {formatCurrency(balance)}
          </p>
          <p
            className={`text-gray-400 dark:text-gray-500 capitalize truncate ${
              isMobile ? "text-xs" : "text-xs lg:text-sm"
            }`}
          >
            {account.type} Account
          </p>
        </div>
      </div>
    </Card>
  );
});

AccountCard.displayName = "AccountCard";
