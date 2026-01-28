/**
 * BudgetPeriodCard Component
 * Individual budget period display with expandable chart
 */

"use client";

import * as React from "react";
import { Card, Badge } from "@/components/ui";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import type { Transaction, Category } from "@/lib/types";
import { formatDateShort } from "@/lib/utils";
import { reportsStyles } from "@/styles/system";
import { BudgetPeriodMetrics } from "./BudgetPeriodMetrics";
import { BudgetPeriodTransactions } from "./BudgetPeriodTransactions";

export interface BudgetPeriodCardProps {
  startDate: string | Date;
  endDate: string | Date | null;
  userName: string;
  userId: string;
  transactions?: Transaction[]; // Optional - Only transactions for this period and user
  transactionCount?: number; // Count if transactions not provided
  categories: Category[];
  isExpanded: boolean;
  onToggle: () => void;
  showUserName?: boolean;
  defaultAccountStartBalance?: number | null;
  defaultAccountEndBalance?: number | null;
  periodTotalSpent?: number;
  periodTotalIncome?: number;
  periodTotalTransfers?: number;
}

const BudgetPeriodCardComponent = ({
  startDate,
  endDate,
  userName,
  transactions,
  transactionCount,
  categories,
  isExpanded,
  onToggle,
  showUserName = false,
  defaultAccountStartBalance,
  defaultAccountEndBalance,
  periodTotalSpent,
  periodTotalIncome,
  periodTotalTransfers,
}: Readonly<BudgetPeriodCardProps>) => {
  const periodStartFormatted = formatDateShort(startDate);
  const periodEndFormatted = endDate ? formatDateShort(endDate) : "In corso";

  // Determine if we have transactions or just a count
  const totalCount = transactionCount ?? transactions?.length ?? 0;
  const showEmptyState = totalCount === 0;

  // Ref for auto-scroll when expanded
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll into view when expanded
  React.useEffect(() => {
    if (isExpanded && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 100);
    }
  }, [isExpanded]);

  const styles = reportsStyles.budgetPeriodCard;

  return (
    <Card ref={cardRef} className={styles.container}>
      {/* Header */}
      <button onClick={onToggle} className={styles.header}>
        {/* Calendar Icon */}
        <div className={styles.headerIcon}>
          <Calendar className={styles.headerIconSize} />
        </div>

        {/* Period Info */}
        <div className={styles.headerContent}>
          <div className={styles.headerTitleRow}>
            <h3 className={styles.headerTitle}>
              {periodStartFormatted} - {periodEndFormatted}
            </h3>
            {showUserName && (
              <Badge variant="outline" className={styles.headerBadge}>
                {userName}
              </Badge>
            )}
          </div>
        </div>

        {/* Chevron with detail label */}
        <div className={styles.headerChevronContainer}>
          <p className={styles.headerDetailLabel}>
            {isExpanded ? "Nascondi" : "Mostra"}
          </p>
          <div className={styles.headerChevron}>
            {isExpanded ? (
              <ChevronUp className={styles.headerChevronIcon} />
            ) : (
              <ChevronDown className={styles.headerChevronIcon} />
            )}
          </div>
        </div>
      </button>

      {/* Metrics Grid */}
      <BudgetPeriodMetrics
        defaultAccountStartBalance={defaultAccountStartBalance}
        defaultAccountEndBalance={defaultAccountEndBalance}
        periodTotalIncome={periodTotalIncome}
        periodTotalSpent={periodTotalSpent}
        periodTotalTransfers={periodTotalTransfers}
      />

      {/* Expandable Transactions Section */}
      {isExpanded && (
        <BudgetPeriodTransactions
          transactions={transactions}
          totalCount={totalCount}
          startDate={startDate}
          endDate={endDate}
          categories={categories}
          showEmptyState={showEmptyState}
        />
      )}
    </Card>
  );
};

// Optimized with React.memo to prevent unnecessary re-renders in large lists
export const BudgetPeriodCard = React.memo(BudgetPeriodCardComponent, (prev, next) => {
  return (
    prev.isExpanded === next.isExpanded &&
    prev.userId === next.userId &&
    prev.startDate === next.startDate &&
    prev.endDate === next.endDate &&
    prev.transactions === next.transactions &&
    prev.defaultAccountStartBalance === next.defaultAccountStartBalance &&
    prev.defaultAccountEndBalance === next.defaultAccountEndBalance &&
    prev.periodTotalSpent === next.periodTotalSpent &&
    prev.periodTotalIncome === next.periodTotalIncome &&
    prev.periodTotalTransfers === next.periodTotalTransfers &&
    prev.showUserName === next.showUserName &&
    prev.userName === next.userName
  );
});

export default BudgetPeriodCard;
