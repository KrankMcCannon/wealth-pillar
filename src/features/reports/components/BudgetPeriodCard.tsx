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
import type { Transaction, Category, CategoryBreakdownItem } from "@/lib/types";
import { BudgetService, CategoryService, FinanceLogicService } from "@/lib/services";
import { ReportMetricsService } from "@/lib/services/report-metrics.service";
import { CategoryIcon, iconSizes } from "@/lib";
import { formatDateShort } from "@/lib/utils/date-utils";
import { reportsStyles } from "../theme/reports-styles";
import { cn } from "@/lib/utils/ui-variants";
import { PeriodMetricsCard } from "./PeriodMetricsCard";

export interface BudgetPeriodCardProps {
  startDate: string | Date;
  endDate: string | Date | null;
  userName: string;
  userId: string;
  userAccountIds: string[]; // Pass pre-filtered account IDs
  allTransactions: Transaction[]; // All transactions for the user
  categories: Category[];
  isExpanded: boolean;
  onToggle: () => void;
  showUserName?: boolean;
}

const BudgetPeriodCardComponent = ({
  startDate,
  endDate,
  userName,
  userId,
  userAccountIds,
  allTransactions,
  categories,
  isExpanded,
  onToggle,
  showUserName = false,
}: Readonly<BudgetPeriodCardProps>) => {
  const periodStartFormatted = BudgetService.formatPeriodDate(startDate);
  const periodEndFormatted = endDate ? BudgetService.formatPeriodDate(endDate) : "In corso";

  // Filter transactions for the current period and user
  const periodTransactions = React.useMemo(() => {
    return FinanceLogicService.filterTransactionsByPeriod(
      allTransactions,
      startDate,
      endDate
    ).filter((t: Transaction) => t.user_id === userId);
  }, [allTransactions, startDate, endDate, userId]);

  // Calculate account-based and budget-based metrics for this period
  const accountMetrics = React.useMemo(() => {
    return ReportMetricsService.calculateAccountBasedMetrics(
      periodTransactions,
      userAccountIds
    );
  }, [periodTransactions, userAccountIds]);

  const budgetMetrics = React.useMemo(() => {
    return ReportMetricsService.calculateBudgetBasedMetrics(
      periodTransactions,
      userAccountIds
    );
  }, [periodTransactions, userAccountIds]);

  const categoryBreakdown = React.useMemo(() => {
    return FinanceLogicService.calculateCategoryBreakdown(periodTransactions);
  }, [periodTransactions]);

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

      {/* Metrics Grid */}
      <div className={styles.metricsContainer}>
        {/* Budget Balance (with internal transfers) */}
        <div className={cn(styles.metricCard, styles.metricCardBudget)}>
          <div className={styles.metricHeader}>
            <div className={cn(styles.metricIconBadge, styles.metricIconBadgeDefault)}>
              <PiggyBank className={cn(styles.metricIcon, styles.metricIconDefault)} />
            </div>
            <div className={styles.metricContent}>
              <p className={cn(styles.metricLabel, styles.metricLabelDefault)}>
                Budget (Con Trasf.)
              </p>
              <Amount
                type={(budgetMetrics.balance + budgetMetrics.balance - accountMetrics.internalTransfers) >= 0 ? "income" : "expense"}
                size="xl"
                emphasis="strong"
                className={cn(
                  styles.metricValue,
                  (budgetMetrics.balance + accountMetrics.internalTransfers) >= 0 ? styles.metricValuePositive : styles.metricValueNegative
                )}
              >
                {budgetMetrics.balance + accountMetrics.internalTransfers}
              </Amount>
            </div>
          </div>
        </div>

        {/* Budget Balance (without internal transfers) */}
        <div className={cn(styles.metricCard, styles.metricCardAccount)}>
          <div className={styles.metricHeader}>
            <div className={cn(styles.metricIconBadge, styles.metricIconBadgeDefault)}>
              <Wallet className={cn(styles.metricIcon, styles.metricIconDefault)} />
            </div>
            <div className={styles.metricContent}>
              <p className={cn(styles.metricLabel, styles.metricLabelDefault)}>
                Budget (Senza Trasf.)
              </p>
              <Amount
                type={budgetMetrics.balance >= 0 ? "income" : "expense"}
                size="xl"
                emphasis="strong"
                className={cn(
                  styles.metricValue,
                  budgetMetrics.balance >= 0 ? styles.metricValuePositive : styles.metricValueNegative
                )}
              >
                {budgetMetrics.balance}
              </Amount>
            </div>
          </div>
        </div>

        {/* Total Internal Transfers */}
        <div className={cn(styles.metricCard, styles.metricCardTransfer)}>
          <div className={styles.metricHeader}>
            <div className={cn(styles.metricIconBadge, styles.metricIconBadgeTransfer)}>
              <ArrowLeftRight className={cn(styles.metricIcon, styles.metricIconTransfer)} />
            </div>
            <div className={styles.metricContent}>
              <p className={cn(styles.metricLabel, styles.metricLabelTransfer)}>
                Trasferimenti
              </p>
              <Amount
                type="balance"
                size="xl"
                emphasis="strong"
                className={cn(styles.metricValue, styles.metricValueTransfer)}
              >
                {accountMetrics.internalTransfers}
              </Amount>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Metrics Section (Account vs Budget) - Expandable */}
      {isExpanded && (
        <div className="p-4 border-t border-primary/10 bg-card/50">
          <p className="text-xs font-semibold text-muted-foreground mb-3">Confronto Metriche</p>
          <PeriodMetricsCard
            accountMoneyIn={accountMetrics.moneyIn}
            accountMoneyOut={accountMetrics.moneyOut}
            accountBalance={accountMetrics.balance}
            internalTransfers={accountMetrics.internalTransfers}
            budgetIncrease={budgetMetrics.budgetIncrease}
            budgetDecrease={budgetMetrics.budgetDecrease}
            budgetBalance={budgetMetrics.balance}
          />
        </div>
      )}

      {/* Expandable Category Breakdown Section */}
      {isExpanded && (
        <div className="p-4 border-t border-primary/10 bg-card/50">
          <p className="text-xs font-semibold text-muted-foreground mb-3">Categorie per Transazione</p>

          {categoryBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nessuna transazione in questo periodo</p>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((item: CategoryBreakdownItem) => {
                const categoryLabel = CategoryService.getCategoryLabel(categories, item.category);
                const categoryColor = CategoryService.getCategoryColor(categories, item.category);
                const isNetSpending = item.net > 0;
                const isNetIncome = item.net < 0;

                return (
                  <div key={item.category} className="space-y-1.5">
                    {/* Category Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Category Icon */}
                        <div
                          className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
                          style={{
                            backgroundColor: `oklch(from ${categoryColor} calc(l + 0.35) c h / 0.15)`,
                            color: categoryColor,
                          }}
                        >
                          <CategoryIcon categoryKey={item.category} size={iconSizes.sm} />
                        </div>

                        {/* Category Name and Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-black truncate">{categoryLabel}</p>
                          <p className="text-xs text-muted-foreground">
                            Speso €{item.spent.toFixed(2)} • Ricevuto €{item.received.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* NET Amount and Percentage */}
                      <div className="text-right shrink-0 ml-2">
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-xs text-muted-foreground">Netto:</span>
                          {(() => {
                            let amountType: "expense" | "income" | "balance" = "balance";
                            let amountClass = "text-gray-700";
                            if (isNetSpending) {
                              amountType = "expense";
                              amountClass = "text-red-700";
                            } else if (isNetIncome) {
                              amountType = "income";
                              amountClass = "text-emerald-700";
                            }
                            return (
                              <Amount type={amountType} size="sm" emphasis="strong" className={amountClass}>
                                {Math.abs(item.net)}
                              </Amount>
                            );
                          })()}
                        </div>
                        {item.percentage > 0 && (
                          <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar (only for net spending categories) */}
                    {item.percentage > 0 && (
                      <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: categoryColor,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Internal Transfers Section (if any) */}
      {isExpanded && accountMetrics.internalTransfers > 0 && (
        <div className="p-4 border-t border-primary/10 bg-amber-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-amber-600" />
              <p className="text-xs font-semibold text-muted-foreground">Trasferimenti Interni</p>
            </div>
            <Amount type="balance" size="sm" emphasis="strong" className="text-amber-700">
              {accountMetrics.internalTransfers}
            </Amount>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Movimenti tra i tuoi conti (esclusi dal calcolo)</p>
        </div>
      )}

      {/* Expandable Transactions Section */}
      {isExpanded && (
        <div className="border-t border-primary/10">
          <div className="p-4 bg-card/50">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Transazioni ({periodTransactions.length})</p>
            {periodTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nessuna transazione in questo periodo</p>
            ) : (
              <div className="space-y-2">
                {periodTransactions.map((transaction) => {
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
    prev.allTransactions === next.allTransactions &&
    prev.userAccountIds === next.userAccountIds
  );
});

export default BudgetPeriodCard;
