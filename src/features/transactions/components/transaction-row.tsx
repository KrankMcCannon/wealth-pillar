"use client";

import { Badge } from "@/components/ui";
import { CategoryIcon, iconSizes, Transaction } from "@/lib";
import { formatCurrency } from "@/lib/utils";
import { memo } from "react";
import { RowCard } from "@/components/ui/layout/row-card";
import {
  transactionStyles,
  getTransactionIconColor,
  getTransactionBadgeColor,
} from "../theme";

interface TransactionRowProps {
  transaction: Transaction;
  accountNames: Record<string, string>;
  variant: "regular" | "recurrent";
  context: "due" | "informative";
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transactionId: string) => void;
  getCategoryLabel: (key: string) => string;
  isOpen: boolean;
  onSwipe: (id: string | null) => void;
}

/**
 * Individual Transaction Row Component
 *
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
  isOpen,
  onSwipe,
}: TransactionRowProps) => {
  // Calculate days until due for recurrent transactions
  const getDaysUntilDue = (): number => {
    if (!transaction.frequency || transaction.frequency === "once") return Infinity;
    // TODO: Implement actual date calculation based on transaction frequency
    return 0;
  };

  const daysUntilDue = getDaysUntilDue();

  // Determine icon color based on variant and context
  const iconColor = (() => {
    const colorClass = getTransactionIconColor(variant, context, daysUntilDue);
    // Map transaction color classes to RowCard iconColor prop
    if (colorClass.includes("text-destructive")) return "destructive";
    if (colorClass.includes("text-warning")) return "warning";
    if (colorClass.includes("text-success")) return "success";
    return "primary";
  })();

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
      icon={<CategoryIcon categoryKey={transaction.category} size={iconSizes.sm} />}
      iconSize="sm"
      iconColor={iconColor}
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
