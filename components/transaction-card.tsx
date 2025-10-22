"use client";

import { Card } from "@/components/ui/card";
import { IconContainer, Text, StatusBadge, Amount } from "@/components/ui/primitives";
import { CategoryIcon, iconSizes } from "@/lib/icons";
import { getCategoryLabel, truncateText } from "@/lib/utils";
import { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TransactionCardProps {
  transaction: Transaction;
  accountNames: Record<string, string>;
  variant?: 'regular' | 'recurrent';
  onClick?: () => void;
}

// Single Transaction Card Component
export function TransactionCard({ 
  transaction, 
  accountNames, 
  variant = 'regular',
  onClick 
}: TransactionCardProps) {
  const getCardStyles = () => {
    switch (variant) {
      case 'recurrent':
        return "p-4 bg-primary/10 backdrop-blur-sm border border-primary/20 hover:shadow-xl hover:shadow-primary/20";
      default:
        return "p-3 mb-2 bg-card/80 backdrop-blur-sm shadow-lg border border-border hover:shadow-xl";
    }
  };

  const getAmountType = (): "income" | "expense" | "balance" => {
    if (variant === 'recurrent') return 'balance';
    return transaction.type === 'income' ? 'income' : 'expense';
  };

  return (
    <Card 
      className={`${getCardStyles()} transition-all duration-300 rounded-2xl group cursor-pointer hover:scale-[1.01]`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <IconContainer size="md" color="primary" className="rounded-xl shrink-0">
            <CategoryIcon
              categoryKey={transaction.category}
              size={iconSizes.sm}
            />
          </IconContainer>
          <div className="flex-1 min-w-0">
            <Text
              variant="heading"
              size="sm"
              as="h3"
              className="group-hover:text-primary/80 transition-colors truncate mb-1"
            >
              {transaction.description}
            </Text>
            <div className="space-y-0.5">
              <Text variant="muted" size="xs">
                {truncateText(accountNames[transaction.account_id] || transaction.account_id, 20)}
              </Text>
              {variant === 'regular' && (
                <Text variant="muted" size="xs">
                  {getCategoryLabel(transaction.category)}
                </Text>
              )}
              {variant === 'recurrent' && transaction.frequency && transaction.frequency !== 'once' && (
                <Text variant="primary" size="xs" className="font-medium">
                  Serie ricorrente - {transaction.frequency}
                </Text>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <Amount
            type={getAmountType()}
            size="md"
            emphasis="strong"
            className={cn(variant === 'recurrent' && 'mb-1', variant === 'recurrent' && 'text-primary')}
          >
            {transaction.type === 'income' ? transaction.amount : -transaction.amount}
          </Amount>
          {variant === 'recurrent' && (
            <StatusBadge status="info" size="sm">
              {transaction.frequency || 'Una volta'}
            </StatusBadge>
          )}
        </div>
      </div>
    </Card>
  );
}
