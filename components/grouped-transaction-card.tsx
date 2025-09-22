"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon, iconSizes } from "@/lib/icons";
import { formatCurrency, getCategoryLabel, truncateText, pluralize } from "@/lib/utils";
import { Transaction } from "@/lib/types";

interface GroupedTransactionCardProps {
  transactions: Transaction[];
  accountNames: Record<string, string>;
  variant?: 'regular' | 'recurrent';
  showHeader?: boolean;
  totalAmount?: number;
  context?: 'due' | 'informative'; // New context parameter
}

export function GroupedTransactionCard({ 
  transactions, 
  accountNames, 
  variant = 'regular',
  showHeader = false,
  totalAmount,
  context = 'informative'
}: GroupedTransactionCardProps) {
  if (!transactions.length) return null;

  const getCardStyles = () => {
    switch (variant) {
      case 'recurrent':
        if (context === 'due') {
          // For due context, we'll determine background based on most urgent transaction
          const mostUrgentDays = Math.min(...transactions.map(tx => getDaysUntilDue(tx)));
          if (mostUrgentDays <= 1) return "py-0 bg-gradient-to-r from-red-50/80 via-red-50/60 to-white/80 backdrop-blur-sm border border-red-200/50 hover:shadow-xl hover:shadow-red-200/30";
          if (mostUrgentDays <= 3) return "py-0 bg-gradient-to-r from-orange-50/80 via-orange-50/60 to-white/80 backdrop-blur-sm border border-orange-200/50 hover:shadow-xl hover:shadow-orange-200/30";
          if (mostUrgentDays <= 7) return "py-0 bg-gradient-to-r from-amber-50/80 via-amber-50/60 to-white/80 backdrop-blur-sm border border-amber-200/50 hover:shadow-xl hover:shadow-amber-200/30";
          return "py-0 bg-gradient-to-r from-blue-50/80 via-blue-50/60 to-white/80 backdrop-blur-sm border border-blue-200/50 hover:shadow-xl hover:shadow-blue-200/30";
        } else {
          return "py-0 bg-gradient-to-r from-blue-50/80 via-white/80 to-white/60 backdrop-blur-sm border border-blue-200/50 hover:shadow-xl hover:shadow-blue-200/30";
        }
      default:
        return "py-0 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300";
    }
  };

  const getSectionHeaderStyles = () => {
    switch (variant) {
      case 'recurrent':
        return "bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-200/50";
      default:
        return "bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200/50";
    }
  };

  const getTotalAmountColor = () => {
    if (variant === 'recurrent') return 'text-blue-700';
    return (totalAmount || 0) >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getDaysUntilDue = (transaction: Transaction): number => {
    // Legacy support for displaying recurring transaction info
    // In the new architecture, this information comes from RecurringTransactionSeries
    if (!transaction.frequency || transaction.frequency === 'once') return Infinity;
    return 0; // Default for display purposes
  };

  const getTransactionAmountColor = (transaction: Transaction) => {
    if (variant === 'recurrent') {
      // In due context, use urgency colors; in informative context, use standard blue
      if (context === 'due') {
        const daysUntilDue = getDaysUntilDue(transaction);
        if (daysUntilDue <= 1) return 'text-red-600'; // Due today/tomorrow
        if (daysUntilDue <= 3) return 'text-orange-600'; // Due in 2-3 days
        if (daysUntilDue <= 7) return 'text-amber-600'; // Due this week
        return 'text-blue-600'; // Normal
      } else {
        return 'text-blue-600'; // Standard blue for informative context
      }
    }
    return transaction.type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionIconColor = (transaction: Transaction) => {
    if (variant === 'recurrent') {
      if (context === 'due') {
        const daysUntilDue = getDaysUntilDue(transaction);
        if (daysUntilDue <= 1) return 'from-red-500/20 to-red-500/10 text-red-600'; // Due today/tomorrow
        if (daysUntilDue <= 3) return 'from-orange-500/20 to-orange-500/10 text-orange-600'; // Due in 2-3 days
        if (daysUntilDue <= 7) return 'from-amber-500/20 to-amber-500/10 text-amber-600'; // Due this week
        return 'from-blue-500/20 to-blue-500/10 text-blue-600'; // Normal
      } else {
        return 'from-blue-500/20 to-blue-500/10 text-blue-600'; // Standard blue for informative context
      }
    }
    return 'from-primary/10 to-primary/5 text-primary';
  };

  const getTransactionBadgeColor = (transaction: Transaction) => {
    if (variant === 'recurrent') {
      if (context === 'due') {
        const daysUntilDue = getDaysUntilDue(transaction);
        if (daysUntilDue <= 1) return 'border-red-200/70 text-red-700 bg-red-50/50'; // Due today/tomorrow
        if (daysUntilDue <= 3) return 'border-orange-200/70 text-orange-700 bg-orange-50/50'; // Due in 2-3 days
        if (daysUntilDue <= 7) return 'border-amber-200/70 text-amber-700 bg-amber-50/50'; // Due this week
        return 'border-blue-200/70 text-blue-700 bg-blue-50/50'; // Normal
      } else {
        return 'border-blue-200/70 text-blue-700 bg-blue-50/50'; // Standard blue for informative context
      }
    }
    return '';
  };

  const formatTransactionAmount = (transaction: Transaction) => {
    return formatCurrency(transaction.type === 'income' ? transaction.amount : -transaction.amount);
  };

  return (
    <Card className={`${getCardStyles()} rounded-2xl overflow-hidden`}>
      {/* Optional Header with Total */}
      {showHeader && totalAmount !== undefined && (
        <div className={`${getSectionHeaderStyles()} px-3 py-2`}>
          <div className="flex items-center justify-between">
            <div className="text-right">
              <p className={`text-sm font-bold ${getTotalAmountColor()}`}>
                {formatCurrency(totalAmount)}
              </p>
              <p className="text-xs">
                {pluralize(transactions.length, 'transazione', 'transazioni')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compact Transactions List */}
      <div className="divide-y divide-slate-100/50">
        {transactions.map((transaction, index) => (
          <div 
            key={transaction.id || index}
            className="px-3 py-2 hover:bg-slate-50/30 transition-colors duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className={`flex size-8 items-center justify-center rounded-lg bg-gradient-to-br ${getTransactionIconColor(transaction)} shadow-sm group-hover:shadow-md transition-all duration-200 shrink-0`}>
                  <CategoryIcon 
                    categoryKey={transaction.category} 
                    size={iconSizes.xs}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 group-hover:text-slate-800 transition-colors truncate text-sm">
                    {transaction.description}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-gray-600">
                      {truncateText(accountNames[transaction.account_id] || transaction.account_id, 12)}
                    </span>
                    {variant === 'regular' && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {getCategoryLabel(transaction.category)}
                        </span>
                      </>
                    )}
                    {variant === 'recurrent' && transaction.frequency && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <Badge variant="outline" className={`text-xs ${getTransactionBadgeColor(transaction)} font-medium px-1 py-0 scale-75 origin-left`}>
                          {transaction.frequency}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right ml-2">
                <p className={`text-sm font-bold ${getTransactionAmountColor(transaction)}`}>
                  {formatTransactionAmount(transaction)}
                </p>
                {variant === 'recurrent' && transaction.frequency && transaction.frequency !== 'once' && (
                  <p className={`text-xs mt-0.5 font-medium ${getTransactionAmountColor(transaction)}`}>
                    Serie ricorrente - {transaction.frequency}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}