"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon, iconSizes } from "@/lib/icons";
import { formatCurrency, getCategoryLabel, truncateText, formatDueDate } from "@/lib/utils";
import { Transaction } from "@/lib/types";

interface TransactionCardProps {
  transaction: Transaction;
  accountNames: Record<string, string>;
  variant?: 'default' | 'upcoming' | 'recurring';
  onClick?: () => void;
}

export function TransactionCard({ 
  transaction, 
  accountNames, 
  variant = 'default',
  onClick 
}: TransactionCardProps) {
  const getCardStyles = () => {
    switch (variant) {
      case 'upcoming':
        return "p-3 bg-gradient-to-r from-orange-50/80 via-white/80 to-white/60 backdrop-blur-sm border border-orange-200/50 hover:shadow-xl hover:shadow-orange-200/30 hover:bg-gradient-to-r hover:from-orange-50 hover:via-white hover:to-white";
      case 'recurring':
        return "p-4 bg-gradient-to-r from-blue-50/80 via-white/80 to-white/60 backdrop-blur-sm border border-blue-200/50 hover:shadow-xl hover:shadow-blue-200/30 hover:bg-gradient-to-r hover:from-blue-50 hover:via-white hover:to-white";
      default:
        return "p-3 mb-2 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 border border-white/50 hover:shadow-xl hover:shadow-slate-200/60";
    }
  };

  const getAmountColor = () => {
    switch (variant) {
      case 'upcoming':
        return 'text-orange-600';
      case 'recurring':
        return 'text-blue-600';
      default:
        return transaction.type === 'income' ? 'text-green-600' : 'text-red-600';
    }
  };

  const getAmountValue = () => {
    switch (variant) {
      case 'upcoming':
        return formatCurrency(-transaction.amount);
      case 'recurring':
        return formatCurrency(transaction.amount);
      default:
        return formatCurrency(transaction.type === 'income' ? transaction.amount : -transaction.amount);
    }
  };

  const getBadgeStyles = () => {
    switch (variant) {
      case 'upcoming':
        return "text-xs border-orange-200/70 text-orange-700 bg-orange-50/50 font-medium px-2 py-1";
      case 'recurring':
        return "text-xs border-blue-200/70 text-blue-700 bg-blue-50/50 font-medium px-2 py-1";
      default:
        return "";
    }
  };

  return (
    <Card 
      className={`${getCardStyles()} transition-all duration-300 rounded-2xl group cursor-pointer hover:scale-[1.01]`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-md shadow-slate-200/30 group-hover:shadow-lg transition-all duration-200 shrink-0">
            <CategoryIcon 
              categoryKey={transaction.category} 
              size={iconSizes.sm}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 group-hover:text-slate-800 transition-colors truncate text-sm mb-1">
              {transaction.description}
            </h3>
            <div className="space-y-0.5">
              <div className="text-xs text-gray-600">
                {truncateText(accountNames[transaction.account_id] || transaction.account_id, 20)}
              </div>
              {variant === 'default' && (
                <div className="text-xs text-gray-500">
                  {getCategoryLabel(transaction.category)}
                </div>
              )}
              {variant === 'upcoming' && transaction.next_due_date && (
                <div className="text-xs text-orange-600 font-medium">
                  {formatDueDate(new Date(transaction.next_due_date))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-base font-bold ${getAmountColor()} ${variant === 'recurring' ? 'mb-1' : ''}`}>
            {getAmountValue()}
          </p>
          {(variant === 'upcoming' || variant === 'recurring') && (
            <Badge variant="outline" className={getBadgeStyles()}>
              {transaction.frequency || 'Una volta'}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}