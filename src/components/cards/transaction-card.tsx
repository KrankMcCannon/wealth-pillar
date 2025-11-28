/**
 * TransactionCard - Domain card for transactions
 *
 * Refactored to use DomainCard abstraction
 * Reduced from 95 lines to ~60 lines (37% reduction)
 * Follows DRY principle by leveraging shared card layout
 */

"use client";

import { Amount, DomainCard, StatusBadge } from "@/src/components/ui";
import { CategoryIcon, cn, iconSizes, Transaction } from "@/src/lib";

interface TransactionCardProps {
  transaction: Transaction;
  accountNames: Record<string, string>;
  variant?: "regular" | "recurrent";
  onClick?: () => void;
}

export function TransactionCard({ transaction, variant = "regular", onClick }: TransactionCardProps) {
  // Determine amount type for color coding
  const getAmountType = (): "income" | "expense" | "balance" => {
    if (variant === "recurrent") return "balance";
    return transaction.type === "income" ? "income" : "expense";
  };

  // Determine card variant
  const cardVariant = variant === "recurrent" ? "highlighted" : "interactive";

  // Build subtitle (account name)
  // const subtitle = truncateText(
  //   accountNames[transaction.account_id] || transaction.account_id,
  //   20
  // );

  // Build detail text (category or recurrence info)
  // const detail = variant === 'regular'
  //   ? getCategoryLabel(transaction.category)
  //   : transaction.frequency && transaction.frequency !== 'once'
  //     ? `Serie ricorrente - ${transaction.frequency}`
  //     : undefined;

  // Primary content: Amount
  const primaryContent = (
    <Amount
      type={getAmountType()}
      size="md"
      emphasis="strong"
      className={cn(variant === "recurrent" && "text-primary")}
    >
      {transaction.type === "income" ? transaction.amount : -transaction.amount}
    </Amount>
  );

  // Secondary content: Frequency badge for recurrent transactions
  const secondaryContent =
    variant === "recurrent" ? (
      <StatusBadge status="info" size="sm">
        {transaction.frequency || "Una volta"}
      </StatusBadge>
    ) : undefined;

  return (
    <DomainCard
      icon={<CategoryIcon categoryKey={transaction.category} size={iconSizes.sm} />}
      iconSize="md"
      iconColor="primary"
      title={transaction.description}
      subtitle={""}
      detail={""}
      primaryContent={primaryContent}
      secondaryContent={secondaryContent}
      variant={cardVariant}
      onClick={onClick}
      testId={`transaction-card-${transaction.id}`}
    />
  );
}
