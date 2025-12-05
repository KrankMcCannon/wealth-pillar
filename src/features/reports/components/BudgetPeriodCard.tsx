/**
 * BudgetPeriodCard Component
 * Individual budget period display with expandable chart
 */

"use client";

import { Card, Badge } from "@/components/ui";
import { Amount } from "@/components/ui/primitives";
import { ChevronDown, ChevronUp, Calendar, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, ArrowLeftRight } from "lucide-react";
import type { Transaction, Category } from "@/lib/types";
import type { CategoryBreakdownItem } from "@/lib/services/report-period.service";
import { CategoryService } from "@/lib/services";
import { CategoryIcon, iconSizes } from "@/lib";
import { formatDateShort } from "@/lib/utils/date-utils";
import { reportsStyles } from "../theme/reports-styles";
import { cn } from "@/lib/utils/ui-variants";

export interface BudgetPeriodCardProps {
  startDate: string | Date;
  endDate: string | Date | null;
  userName: string;
  totalEarned: number;
  totalSpent: number;
  totalGain: number;
  totalRealSpent: number;
  totalRealReceived: number;
  totalRealGain: number;
  internalTransfers: number;
  categoryBreakdown: CategoryBreakdownItem[];
  transactions: Transaction[];
  categories: Category[];
  isExpanded: boolean;
  onToggle: () => void;
  showUserName?: boolean; // Show user name if displaying "all members"
}

export function BudgetPeriodCard({
  startDate,
  endDate,
  userName,
  totalRealSpent,
  totalRealReceived,
  totalRealGain,
  internalTransfers,
  categoryBreakdown,
  transactions,
  categories,
  isExpanded,
  onToggle,
  showUserName = false,
}: Readonly<BudgetPeriodCardProps>) {
  // Format period dates (handle UTC dates correctly to avoid timezone shifts)
  const formatPeriodDate = (date: string | Date): string => {
    const d = new Date(date);
    // Use UTC methods to avoid timezone conversion issues
    const day = d.getUTCDate();
    const month = d.toLocaleDateString("it-IT", { month: "short", timeZone: "UTC" });
    const year = d.getUTCFullYear();
    return `${day} ${month} ${year}`;
  };

  const periodStartFormatted = formatPeriodDate(startDate);
  const periodEndFormatted = endDate ? formatPeriodDate(endDate) : "In corso";

  const isPositiveGain = totalRealGain >= 0;

  return (
    <Card className={reportsStyles.card.container}>
      {/* Clickable Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-colors"
      >
        <div className="flex-1 flex items-center gap-3">
          {/* Calendar Icon */}
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary shrink-0">
            <Calendar className="h-5 w-5" />
          </div>

          {/* Period Info */}
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-black truncate">
                {periodStartFormatted} - {periodEndFormatted}
              </p>
              {showUserName && (
                <Badge variant="secondary" className="text-xs">
                  {userName}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Clicca per {isExpanded ? "nascondere" : "vedere"} i dettagli
            </p>
          </div>
        </div>

        {/* Gain Indicator & Chevron */}
        <div className="flex items-center gap-3 shrink-0">
          <div className={cn(
            "flex flex-col items-end",
            isPositiveGain ? "text-emerald-600" : "text-red-600"
          )}>
            <p className="text-xs font-medium">
              {isPositiveGain ? "Saldo Reale" : "Perdita"}
            </p>
            <Amount
              type={isPositiveGain ? "income" : "expense"}
              size="sm"
              emphasis="strong"
              className={isPositiveGain ? "text-emerald-700" : "text-red-700"}
            >
              {Math.abs(totalRealGain)}
            </Amount>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-primary" />
          ) : (
            <ChevronDown className="h-5 w-5 text-primary" />
          )}
        </div>
      </button>

      {/* Metrics Section (Always Visible) - NET Analysis */}
      <div className={cn(
        reportsStyles.card.divider,
        "grid grid-cols-3 gap-0"
      )}>
        {/* Real Income (Net Received) */}
        <div className="p-4 border-r border-primary/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <p className="text-xs font-medium text-muted-foreground">Entrate Nette</p>
          </div>
          <Amount type="income" size="md" emphasis="strong" className="text-emerald-700">
            {totalRealReceived}
          </Amount>
        </div>

        {/* Real Expenses (Net Spent) */}
        <div className="p-4 border-r border-primary/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <p className="text-xs font-medium text-muted-foreground">Uscite Nette</p>
          </div>
          <Amount type="expense" size="md" emphasis="strong" className="text-red-700">
            {totalRealSpent}
          </Amount>
        </div>

        {/* Real Balance */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isPositiveGain ? "bg-emerald-600" : "bg-red-600"
            )} />
            <p className="text-xs font-medium text-muted-foreground">Saldo Reale</p>
          </div>
          <Amount
            type={isPositiveGain ? "income" : "expense"}
            size="md"
            emphasis="strong"
            className={isPositiveGain ? "text-emerald-700" : "text-red-700"}
          >
            {Math.abs(totalRealGain)}
          </Amount>
        </div>
      </div>

      {/* Expandable Category Breakdown Section */}
      {isExpanded && (
        <div className="p-4 border-t border-primary/10 bg-card/50">
          <p className="text-xs font-semibold text-muted-foreground mb-3">
            Categorie per Transazione
          </p>

          {categoryBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nessuna transazione in questo periodo
            </p>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((item) => {
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
                            color: categoryColor
                          }}
                        >
                          <CategoryIcon categoryKey={item.category} size={iconSizes.sm} />
                        </div>

                        {/* Category Name and Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-black truncate">
                            {categoryLabel}
                          </p>
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
                              <Amount
                                type={amountType}
                                size="sm"
                                emphasis="strong"
                                className={amountClass}
                              >
                                {Math.abs(item.net)}
                              </Amount>
                            );
                          })()}
                        </div>
                        {item.percentage > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {item.percentage.toFixed(1)}%
                          </p>
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
                            backgroundColor: categoryColor
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
      {isExpanded && internalTransfers > 0 && (
        <div className="p-4 border-t border-primary/10 bg-amber-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-amber-600" />
              <p className="text-xs font-semibold text-muted-foreground">
                Trasferimenti Interni
              </p>
            </div>
            <Amount type="balance" size="sm" emphasis="strong" className="text-amber-700">
              {internalTransfers}
            </Amount>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Movimenti tra i tuoi conti (esclusi dal calcolo)
          </p>
        </div>
      )}

      {/* Expandable Transactions Section */}
      {isExpanded && (
        <div className="border-t border-primary/10">
          <div className="p-4 bg-card/50">
            <p className="text-xs font-semibold text-muted-foreground mb-3">
              Transazioni ({transactions.length})
            </p>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nessuna transazione in questo periodo
              </p>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => {
                  const categoryLabel = CategoryService.getCategoryLabel(categories, transaction.category);
                  const categoryColor = CategoryService.getCategoryColor(categories, transaction.category);

                  const getTransactionIcon = () => {
                    if (transaction.type === 'income') return ArrowUpRight;
                    if (transaction.type === 'expense') return ArrowDownRight;
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
                          color: categoryColor
                        }}
                      >
                        <TransactionIcon className="h-4 w-4" />
                      </div>

                      {/* Transaction Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-black truncate">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {categoryLabel}
                          </span>
                          <span className="text-xs text-muted-foreground/50">•</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateShort(transaction.date)}
                          </span>
                        </div>
                      </div>

                      {/* Amount */}
                      <Amount
                        type={transaction.type}
                        size="sm"
                        emphasis="strong"
                        className="shrink-0"
                      >
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
}
