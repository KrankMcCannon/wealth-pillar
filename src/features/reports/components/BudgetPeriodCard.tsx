/**
 * BudgetPeriodCard Component
 * Individual budget period display with expandable chart
 */

"use client";

import * as React from "react";
import { Card, Badge } from "@/components/ui";
import { Amount } from "@/components/ui/primitives";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
} from "lucide-react";
import type { Transaction, Category } from "@/lib/types";
import { BudgetService, CategoryService } from "@/lib/services";
import { formatDateShort } from "@/lib/utils/date-utils";
import { reportsStyles } from "../theme/reports-styles";
import { cn } from "@/lib/utils/ui-variants";

export interface BudgetPeriodCardProps {
  startDate: string | Date;
  endDate: string | Date | null;
  userName: string;
  userId: string;
  transactions: Transaction[]; // Only transactions for this period and user
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
  const periodStartFormatted = BudgetService.formatPeriodDate(startDate);
  const periodEndFormatted = endDate ? BudgetService.formatPeriodDate(endDate) : "In corso";

  // Note: Transactions are already filtered by period and user in the parent component

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
              <Badge variant="secondary" className={styles.headerBadge}>
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

      {/* Metrics Grid - Default Account History */}
      <div className={styles.metricsContainer}>
        {/* Start Balance */}
        <div className={cn(styles.metricCard, styles.metricCardTransfer)}>
          <div className={styles.metricHeader}>
            <div className={cn(styles.metricIconBadge, styles.metricIconBadgeDefault)}>
              <PiggyBank className={cn(styles.metricIcon, styles.metricIconDefault)} />
            </div>
            <div className={styles.metricContent}>
              <p className={cn(styles.metricLabel, styles.metricLabelDefault)}>
                Saldo Iniziale
              </p>
              <Amount
                type="balance"
                size="xl"
                emphasis="strong"
                className={cn(styles.metricValue, "text-primary")}
              >
                {defaultAccountStartBalance ?? 0}
              </Amount>
            </div>
          </div>
        </div>

        {/* Total Income (Entrate Totali) */}
        <div className={cn(styles.metricCard, styles.metricCardBudget)}>
          <div className={styles.metricHeader}>
            <div className={cn(styles.metricIconBadge, styles.metricIconBadgeDefault)}>
              <Wallet className={cn(styles.metricIcon, styles.metricIconDefault)} />
            </div>
            <div className={styles.metricContent}>
              <p className={cn(styles.metricLabel, styles.metricLabelDefault)}>
                Entrate Totali
              </p>
              <Amount
                type="income"
                size="xl"
                emphasis="strong"
                className={cn(styles.metricValue, "text-emerald-500")}
              >
                {periodTotalIncome ?? 0}
              </Amount>
            </div>
          </div>
        </div>

        {/* Total Spent (Uscite Totali) */}
        <div className={cn(styles.metricCard, styles.metricCardAccount)}>
          <div className={styles.metricHeader}>
            <div className={cn(styles.metricIconBadge, styles.metricIconBadgeTransfer)}>
              <ArrowLeftRight className={cn(styles.metricIcon, styles.metricIconTransfer)} />
            </div>
            <div className={styles.metricContent}>
              <p className={cn(styles.metricLabel, styles.metricLabelTransfer)}>
                Uscite Totali
              </p>
              <Amount
                type="expense"
                size="xl"
                emphasis="strong"
                className={cn(styles.metricValue, "text-red-500")}
              >
                {periodTotalSpent ?? 0}
              </Amount>
            </div>
          </div>
        </div>

        {/* End Balance */}
        <div className={cn(styles.metricCard, styles.metricCardTransfer)}>
          <div className={styles.metricHeader}>
            <div className={cn(styles.metricIconBadge, styles.metricIconBadgeDefault)}>
              <PiggyBank className={cn(styles.metricIcon, styles.metricIconDefault)} />
            </div>
            <div className={styles.metricContent}>
              <p className={cn(styles.metricLabel, styles.metricLabelDefault)}>
                Saldo Finale
              </p>
              <Amount
                type="balance"
                size="xl"
                emphasis="strong"
                className={cn(styles.metricValue, styles.metricValuePositive)}
              >
                {defaultAccountEndBalance ?? 0}
              </Amount>
            </div>
          </div>
        </div>

        {/* Total Transfers */}
        <div className={cn(styles.metricCard, styles.metricCardAccount)}>
          <div className={styles.metricHeader}>
            <div className={cn(styles.metricIconBadge, styles.metricIconBadgeTransfer)}>
              <ArrowLeftRight className={cn(styles.metricIcon, styles.metricIconTransfer)} />
            </div>
            <div className={styles.metricContent}>
              <p className={cn(styles.metricLabel, styles.metricLabelTransfer)}>
                Totale Trasferimenti
              </p>
              <Amount
                type="balance"
                size="xl"
                emphasis="strong"
                className={cn(styles.metricValue, "text-amber-500")}
              >
                {periodTotalTransfers ?? 0}
              </Amount>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Transactions Section */}
      {isExpanded && (
        <div className="border-t border-primary/10">
          <div className="p-4 bg-card/50">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Transazioni ({transactions.length})</p>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nessuna transazione in questo periodo</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => {
                  const categoryLabel = CategoryService.getCategoryLabel(categories, transaction.category);
                  const categoryColor = CategoryService.getCategoryColor(categories, transaction.category);

                  const getTransactionIcon = () => {
                    if (transaction.type === "income") return ArrowUpRight;
                    if (transaction.type === "expense") return ArrowDownRight;
                    return ArrowLeftRight;
                  };
                  const TransactionIcon = getTransactionIcon();

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/50 border border-primary/5 hover:border-primary/20 transition-colors"
                    >
                      {/* Transaction Icon */}
                      <div
                        className="flex items-center justify-center h-9 w-9 rounded-lg shrink-0"
                        style={{
                          backgroundColor: `oklch(from ${categoryColor} calc(l + 0.35) c h / 0.15)`,
                          color: categoryColor,
                        }}
                      >
                        <TransactionIcon className="h-4 w-4" />
                      </div>

                      {/* Transaction Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-black truncate">{transaction.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{categoryLabel}</span>
                          <span className="text-xs text-muted-foreground/50">•</span>
                          <span className="text-xs text-muted-foreground">{formatDateShort(transaction.date)}</span>
                        </div>
                      </div>

                      {/* Amount */}
                      <Amount type={transaction.type} size="sm" emphasis="strong" className="shrink-0">
                        {transaction.amount}
                      </Amount>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
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
    prev.periodTotalTransfers === next.periodTotalTransfers
  );
});

export default BudgetPeriodCard;
