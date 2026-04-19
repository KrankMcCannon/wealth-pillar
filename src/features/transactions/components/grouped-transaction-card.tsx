'use client';

import { memo, useCallback } from 'react';
import { Card } from '@/components/ui';
import { useTranslations } from 'next-intl';
import { Transaction, Category } from '@/lib';
import {
  getCategoryLabel as getCategoryLabelLogic,
  getCategoryColor as getCategoryColorLogic,
} from '@/server/use-cases/categories/category.logic';
import { formatCurrency, cn } from '@/lib/utils';
import { TransactionRow } from './transaction-row';
import {
  transactionStyles,
  getCardVariantStyles,
  getHeaderVariantStyles,
  getTotalAmountColor,
} from '@/styles/system';

interface GroupedTransactionCardProps {
  transactions: Transaction[];
  accountNames: Record<string, string>;
  variant?: 'regular' | 'recurrent';
  showHeader?: boolean;
  totalAmount?: number;
  context?: 'due' | 'informative';
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
 * - Swipe-to-delete on individual rows (global state coordination)
 * - Tap to edit with smooth animation delays
 * - Optional total header
 * - Context-aware styling (due vs informative)
 * - Apple-style interactions with unified swipe system
 */
function GroupedTransactionCardInner({
  transactions,
  accountNames,
  variant = 'regular',
  showHeader = false,
  totalAmount,
  context = 'informative',
  categories = [],
  onEditTransaction,
  onDeleteTransaction,
}: Readonly<GroupedTransactionCardProps>) {
  const t = useTranslations('Transactions.GroupedCard');
  const getCategoryLabel = useCallback(
    (categoryKey: string) => getCategoryLabelLogic(categories, categoryKey),
    [categories]
  );
  const getCategoryColor = useCallback(
    (categoryKey: string) => getCategoryColorLogic(categories, categoryKey),
    [categories]
  );

  if (!transactions.length) return null;

  return (
    <Card className={cn(getCardVariantStyles(variant))}>
      {/* Optional Header with Total */}
      {showHeader && totalAmount !== undefined && (
        <div className={getHeaderVariantStyles(variant)}>
          <div className={transactionStyles.groupedCard.headerContent}>
            <span className={transactionStyles.groupedCard.headerLabel}>{t('periodTotal')}</span>
            <p
              className={`${transactionStyles.groupedCard.headerAmount} ${getTotalAmountColor(variant, totalAmount)}`}
            >
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>
      )}

      {/* Transaction Rows */}
      <div className={transactionStyles.groupedCard.rowContainer}>
        {transactions.map((transaction, index) => (
          <TransactionRow
            key={transaction.id ?? `temp-${transaction.date ?? 'unknown'}-${index}`}
            transaction={transaction}
            accountNames={accountNames}
            variant={variant}
            context={context}
            onEditTransaction={onEditTransaction}
            onDeleteTransaction={onDeleteTransaction}
            getCategoryLabel={getCategoryLabel}
            getCategoryColor={getCategoryColor}
          />
        ))}
      </div>
    </Card>
  );
}

export const GroupedTransactionCard = memo(GroupedTransactionCardInner);
