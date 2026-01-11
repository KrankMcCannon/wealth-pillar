"use client";

import { Badge, CategoryBadge } from "@/components/ui";
import { Transaction } from "@/lib";
import { formatCurrency } from "@/lib/utils";
import { memo } from "react";
import { RowCard } from "@/components/ui/layout/row-card";
import {
  transactionStyles,
  getTransactionBadgeColor,
} from "@/styles/system";

interface TransactionRowProps {
  transaction: Transaction;
  accountNames: Record<string, string>;
  variant: "regular" | "recurrent";
  context: "due" | "informative";
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transactionId: string) => void;
  getCategoryLabel: (key: string) => string;
  getCategoryColor: (key: string) => string;
  isOpen: boolean;
  onSwipe: (id: string | null) => void;
}

/**
 * Individual Transaction Row Component
 * Now powered by the unified RowCard component.
 * This is a thin wrapper that maps transaction-specific props to RowCard's generic API.
 *
 * Features:
 * - Swipe-to-delete gesture (via RowCard)
 * - Smart tap detection (via RowCard)
 * - Smooth spring animations (via RowCard)
 * - Transaction-specific styling and layout
 */
export const TransactionRow = memo(({
  transaction,
  accountNames,
  variant,
  context,
  onEditTransaction,
  onDeleteTransaction,
  getCategoryLabel,
  getCategoryColor,
  isOpen,
  onSwipe,
}: TransactionRowProps) => {
  // Calculate days until due for recurrent transactions
  const getDaysUntilDue = (): number => {
    if (!transaction.frequency || transaction.frequency === "once") return Infinity;
    return 0;
  };

  const daysUntilDue = getDaysUntilDue();

  // Build metadata section (category + account/frequency)
  const metadata = (
    <>
      <span className={transactionStyles.transactionRow.metadataText}>
        {getCategoryLabel(transaction.category)}
      </span>

      {/* Account name for regular transactions */}
      {variant === "regular" && transaction.account_id && accountNames[transaction.account_id] && (
        <>
          <span className={transactionStyles.transactionRow.separator}>•</span>
          <span className={transactionStyles.transactionRow.metadataSecondary}>
            {accountNames[transaction.account_id]}
          </span>
        </>
      )}

      {/* Frequency badge for recurrent transactions */}
      {variant === "recurrent" && transaction.frequency && (
        <>
          <span className={transactionStyles.transactionRow.separator}>•</span>
          <Badge
            variant="outline"
            className={`${transactionStyles.transactionRow.badge} ${getTransactionBadgeColor(
              variant,
              context,
              daysUntilDue
            )}`}
          >
            {transaction.frequency}
          </Badge>
        </>
      )}
    </>
  );

  // Build primary value (amount)
  const primaryValue = formatCurrency(Math.abs(transaction.amount));

  // Build secondary value (frequency for recurrent)
  const secondaryValue =
    variant === "recurrent" && transaction.frequency && transaction.frequency !== "once"
      ? transaction.frequency
      : undefined;

  const amountVariant = variant === "recurrent"
    ? "primary"
    : transaction.type === "income"
      ? "success"
      : transaction.type === "expense"
        ? "destructive"
        : "primary";

  return (
    <RowCard
      // Layout
      icon={
        <CategoryBadge
          categoryKey={transaction.category}
          color={getCategoryColor(transaction.category)}
          size="sm"
        />
      }
      iconSize="sm"
      iconColor="none"
      title={transaction.description}
      metadata={metadata}
      primaryValue={primaryValue}
      secondaryValue={secondaryValue}
      amountVariant={amountVariant}

      // Interaction
      variant={variant === "regular" ? "interactive" : "highlighted"}
      onClick={() => onEditTransaction?.(transaction)}
      onDelete={onDeleteTransaction ? () => onDeleteTransaction(transaction.id) : undefined}

      // Swipe gesture
      isSwipeOpen={isOpen}
      onSwipeChange={(open) => onSwipe(open ? transaction.id : null)}
      deleteLabel="Elimina"

      // Styling (maintain transaction-specific wrapper styles)
      className={transactionStyles.transactionRow.content}
      testId={`transaction-row-${transaction.id}`}
    />
  );
});

TransactionRow.displayName = "TransactionRow";
