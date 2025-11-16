"use client";

import { Badge, Button, Card } from "@/src/components/ui";
import { CategoryIcon, iconSizes, Transaction, Category } from "@/src/lib";
import { CategoryService } from "@/lib/services";
import { formatCurrency } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface GroupedTransactionCardProps {
  transactions: Transaction[];
  accountNames: Record<string, string>;
  variant?: "regular" | "recurrent";
  showHeader?: boolean;
  totalAmount?: number;
  context?: "due" | "informative"; // New context parameter
  categories?: Category[]; // Categories for displaying labels
  onEditTransaction?: (transaction: Transaction) => void; // Callback for editing
  onDeleteTransaction?: (transactionId: string) => void; // Callback for deleting
}

export function GroupedTransactionCard({
  transactions,
  accountNames,
  variant = "regular",
  showHeader = false,
  totalAmount,
  context = "informative",
  categories = [],
  onEditTransaction,
  onDeleteTransaction,
}: GroupedTransactionCardProps) {
  if (!transactions.length) return null;

  // Helper to get category label
  const getCategoryLabel = (categoryKey: string) => {
    return CategoryService.getCategoryLabel(categories, categoryKey);
  };

  const getCardStyles = () => {
    switch (variant) {
      case "recurrent":
        if (context === "due") {
          // For due context, we'll determine background based on most urgent transaction
          const mostUrgentDays = Math.min(...transactions.map((tx) => getDaysUntilDue(tx)));
          if (mostUrgentDays <= 1)
            return "py-0 bg-destructive/10 backdrop-blur-sm border border-destructive/30 hover:shadow-xl hover:shadow-destructive/20";
          if (mostUrgentDays <= 3)
            return "py-0 bg-warning/10 backdrop-blur-sm border border-warning/30 hover:shadow-xl hover:shadow-warning/20";
          if (mostUrgentDays <= 7)
            return "py-0 bg-warning/10 backdrop-blur-sm border border-warning/30 hover:shadow-xl hover:shadow-warning/20";
          return "py-0 bg-primary/10 backdrop-blur-sm border border-primary/20 hover:shadow-xl hover:shadow-primary/20";
        } else {
          return "py-0 bg-primary/10 backdrop-blur-sm border border-primary/20 hover:shadow-xl hover:shadow-primary/20";
        }
      default:
        return "py-0 bg-card backdrop-blur-sm border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300";
    }
  };

  const getSectionHeaderStyles = () => {
    switch (variant) {
      case "recurrent":
        return "bg-primary/10 border-b border-primary/20";
      default:
        return "bg-primary/5 border-b border-primary/20";
    }
  };

  const getTotalAmountColor = () => {
    if (variant === "recurrent") return "text-primary";
    return (totalAmount || 0) >= 0 ? "text-primary" : "text-destructive";
  };

  const getDaysUntilDue = (transaction: Transaction): number => {
    // Legacy support for displaying recurring transaction info
    // In the new architecture, this information comes from RecurringTransactionSeries
    if (!transaction.frequency || transaction.frequency === "once") return Infinity;
    return 0; // Default for display purposes
  };

  const getTransactionAmountColor = (transaction: Transaction) => {
    if (variant === "recurrent") {
      // In due context, use urgency colors; in informative context, use standard purple
      if (context === "due") {
        const daysUntilDue = getDaysUntilDue(transaction);
        if (daysUntilDue <= 1) return "text-destructive"; // Due today/tomorrow
        if (daysUntilDue <= 3) return "text-warning"; // Due in 2-3 days
        if (daysUntilDue <= 7) return "text-warning/80"; // Due this week
        return "text-primary"; // Normal
      } else {
        return "text-primary"; // Standard primary for informative context
      }
    }
    // Transfer type uses neutral color (not calculated in daily totals)
    if (transaction.type === "transfer") return "text-primary";
    return transaction.type === "income" ? "text-success" : "text-destructive";
  };

  const getTransactionIconColor = (transaction: Transaction) => {
    if (variant === "recurrent") {
      if (context === "due") {
        const daysUntilDue = getDaysUntilDue(transaction);
        if (daysUntilDue <= 1) return "bg-destructive/10 text-destructive"; // Due today/tomorrow
        if (daysUntilDue <= 3) return "bg-warning/10 text-warning"; // Due in 2-3 days
        if (daysUntilDue <= 7) return "bg-warning/5 text-warning/80"; // Due this week
        return "bg-primary/10 text-primary"; // Normal
      } else {
        return "bg-primary/10 text-primary"; // Standard primary for informative context
      }
    }
    // Transfer type uses neutral/muted background
    if (transaction.type === "transfer") return "bg-muted/50 text-primary";
    return "bg-primary/10 text-primary";
  };

  const getTransactionBadgeColor = (transaction: Transaction) => {
    if (variant === "recurrent") {
      if (context === "due") {
        const daysUntilDue = getDaysUntilDue(transaction);
        if (daysUntilDue <= 1) return "border-destructive/30 text-destructive bg-destructive/10"; // Due today/tomorrow
        if (daysUntilDue <= 3) return "border-warning/30 text-warning bg-warning/10"; // Due in 2-3 days
        if (daysUntilDue <= 7) return "border-warning/20 text-warning/80 bg-warning/5"; // Due this week
        return "border-primary/20 text-primary bg-primary/10"; // Normal
      } else {
        return "border-primary/20 text-primary bg-primary/10"; // Standard primary for informative context
      }
    }
    return "";
  };

  return (
    <Card className={`${getCardStyles()} rounded-2xl overflow-hidden`}>
      {/* Optional Header with Total */}
      {showHeader && totalAmount !== undefined && (
        <div className={`${getSectionHeaderStyles()} px-3 py-2`}>
          <div className="flex items-center justify-between">
            <div className="text-right">
              <p className={`text-sm font-bold ${getTotalAmountColor()}`}>{totalAmount}</p>
              <p className="text-xs">{0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Compact Transactions List */}
      <div className="divide-y divide-primary/10">
        {transactions.map((transaction, index) => (
          <div
            key={transaction.id || index}
            className="px-3 py-2 hover:bg-accent/10 transition-colors duration-200 group relative"
          >
            <div className="flex items-center justify-between gap-2">
              <div
                className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                onClick={() => onEditTransaction?.(transaction)}
              >
                <div
                  className={`flex size-8 items-center justify-center rounded-lg ${getTransactionIconColor(
                    transaction
                  )} shadow-sm group-hover:shadow-md transition-all duration-200 shrink-0`}
                >
                  <CategoryIcon categoryKey={transaction.category} size={iconSizes.xs} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium transition-colors truncate text-sm">{transaction.description}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-foreground/60">{getCategoryLabel(transaction.category)}</span>
                    {variant === "regular" && transaction.account_id && accountNames[transaction.account_id] && (
                      <>
                        <span className="text-xs text-primary/40">•</span>
                        <span className="text-xs text-foreground/50">{accountNames[transaction.account_id]}</span>
                      </>
                    )}
                    {variant === "recurrent" && transaction.frequency && (
                      <>
                        <span className="text-xs text-primary/40">•</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getTransactionBadgeColor(
                            transaction
                          )} font-medium px-1 py-0 scale-75 origin-left`}
                        >
                          {transaction.frequency}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount and Delete Button */}
              <div className="flex items-center gap-2">
                {/* Delete Button - visible on hover */}
                {onDeleteTransaction && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTransaction(transaction.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}

                <div className="text-right">
                  <p className={`text-sm font-bold ${getTransactionAmountColor(transaction)}`}>
                    {formatCurrency(Math.abs(transaction.amount))}
                  </p>
                  {variant === "recurrent" && transaction.frequency && transaction.frequency !== "once" && (
                    <p className={`text-xs mt-0.5 font-medium ${getTransactionAmountColor(transaction)}`}>
                      Serie ricorrente - {transaction.frequency}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
