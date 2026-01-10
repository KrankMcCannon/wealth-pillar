"use client";

import { Card } from "@/components/ui";
import { Transaction, Category } from "@/lib";
import { CategoryService } from "@/lib/services";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { TransactionRow } from "./transaction-row";
import {
  transactionStyles,
  getCardVariantStyles,
  getHeaderVariantStyles,
  getTotalAmountColor
} from "../theme";
import { cn } from "@/lib/utils";

interface GroupedTransactionCardProps {
  transactions: Transaction[];
  accountNames: Record<string, string>;
  variant?: "regular" | "recurrent";
  showHeader?: boolean;
  totalAmount?: number;
  context?: "due" | "informative";
  categories?: Category[];
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transactionId: string) => void;
}

/**
 * Grouped Transaction Card Component
 *
 * Displays a list of transactions in a card with optional header.
 * Supports both regular and recurrent transaction variants.
 *
 * Features:
 * - Swipe-to-delete on individual rows
 * - Tap to edit
 * - Optional total header
 * - Context-aware styling (due vs informative)
 *
 * Refactored from 304 lines to ~100 lines through:
 * - Extraction of TransactionRow to separate file
 * - Centralization of all styles to theme system
 * - Use of style utility functions
 *
 * All styling and animation behavior is now managed through the theme system,
 * making it easy to tune and maintain consistency across the app.
 */
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
  const [openTransactionId, setOpenTransactionId] = useState<string | null>(null);

  if (!transactions.length) return null;

  const getCategoryLabel = (categoryKey: string) => {
    return CategoryService.getCategoryLabel(categories, categoryKey);
  };

  return (
    <>
      {/* Backdrop invisibile per chiudere row quando si clicca fuori */}
      {openTransactionId && (
        <div
          className={transactionStyles.groupedCard.backdrop}
          onClick={() => setOpenTransactionId(null)}
          onTouchEnd={() => setOpenTransactionId(null)}
        />
      )}

      <Card
        className={cn(
          getCardVariantStyles(variant),
          openTransactionId && transactionStyles.groupedCard.openState
        )}
        onClick={() => {
          // Se il click arriva qui, significa che non è stato fermato da una row
          // (le row fanno stopPropagation), quindi chiudi la row aperta
          if (openTransactionId) {
            setOpenTransactionId(null);
          }
        }}
      >
        {/* Optional Header with Total */}
        {showHeader && totalAmount !== undefined && (
        <div className={getHeaderVariantStyles(variant)}>
          <div className={transactionStyles.groupedCard.headerContent}>
            <span className={transactionStyles.groupedCard.headerLabel}>
              Totale Periodo
            </span>
            <p className={`${transactionStyles.groupedCard.headerAmount} ${getTotalAmountColor(variant, totalAmount)}`}>
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>
      )}

      {/* Transaction Rows */}
      <div className={transactionStyles.groupedCard.rowContainer}>
        {transactions.map((transaction, index) => (
          <TransactionRow
            key={transaction.id || index}
            transaction={transaction}
            accountNames={accountNames}
            variant={variant}
            context={context}
            onEditTransaction={(tx) => {
              // Prima chiudi la row aperta se ce n'è una
              if (openTransactionId) {
                setOpenTransactionId(null);
                // Apri modale con delay per animazione fluida di chiusura
                setTimeout(() => {
                  onEditTransaction?.(tx);
                }, 200);
              } else {
                // Nessuna row aperta, apri modale direttamente
                onEditTransaction?.(tx);
              }
            }}
            onDeleteTransaction={onDeleteTransaction}
            getCategoryLabel={getCategoryLabel}
            isOpen={openTransactionId === transaction.id}
            onSwipe={(id) => setOpenTransactionId(id)}
          />
        ))}
        </div>
      </Card>
    </>
  );
}
