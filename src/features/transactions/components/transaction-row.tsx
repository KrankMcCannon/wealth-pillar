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
import { useCloseAllCards } from "@/stores/swipe-state-store";

interface TransactionRowProps {
  transaction: Transaction;
  accountNames: Record<string, string>;
  variant: "regular" | "recurrent";
  context: "due" | "informative";
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transactionId: string) => void;
  getCategoryLabel: (key: string) => string;
  getCategoryColor: (key: string) => string;
}

/**
 * Individual Transaction Row Component
 * Now powered by the unified RowCard component with global swipe state.
 * This is a thin wrapper that maps transaction-specific props to RowCard's generic API.
 *
 * Features:
 * - Swipe-to-delete gesture (via unified SwipeableCard)
 * - Global swipe coordination (only one open at a time)
 * - Apple-style physics and animations
 * - Smart tap vs. drag detection
 * - Auto-close after action execution
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
}: TransactionRowProps) => {
  const closeAllCards = useCloseAllCards();
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

  // Handle delete action with swipe close-first pattern
  const handleDelete = () => {
    closeAllCards();
    onDeleteTransaction?.(transaction.id);
  };

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

      // Swipe configuration (new unified system)
      swipeConfig={onDeleteTransaction ? {
        id: `transaction-${transaction.id}`,
        deleteAction: {
          label: "Elimina",
          variant: "delete",
          onAction: handleDelete,
        },
        onCardClick: () => onEditTransaction?.(transaction),
      } : undefined}

      // Styling (maintain transaction-specific wrapper styles)
      className={transactionStyles.transactionRow.content}
      testId={`transaction-row-${transaction.id}`}
    />
  );
});

TransactionRow.displayName = "TransactionRow";
