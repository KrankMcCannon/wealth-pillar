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
import { stitchTransactions } from '@/styles/home-design-foundation';
import { TransactionRow } from './transaction-row';
import {
  transactionStyles,
  getCardVariantStyles,
  getHeaderVariantStyles,
  getTotalAmountColor,
} from '@/features/transactions/theme/transaction-styles';

interface GroupedTransactionCardProps {
  transactions: Transaction[];
  accountNames: Record<string, string>;
  variant?: 'regular' | 'recurrent';
  showHeader?: boolean;
  totalAmount?: number;
  context?: 'due' | 'informative';
  categories?: Category[];
  onEditTransaction?: (transaction: Transaction) => void;
}

/**
 * Grouped Transaction Card Component
 *
 * Displays a list of transactions in a card with optional header.
 * Supports both regular and recurrent transaction variants.
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

  const header =
    showHeader && totalAmount !== undefined ? (
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
    ) : null;

  const rows = transactions.map((transaction, index) => (
    <TransactionRow
      key={transaction.id ?? `temp-${transaction.date ?? 'unknown'}-${index}`}
      transaction={transaction}
      accountNames={accountNames}
      variant={variant}
      context={context}
      onEditTransaction={onEditTransaction}
      getCategoryLabel={getCategoryLabel}
      getCategoryColor={getCategoryColor}
    />
  ));

  if (variant === 'regular') {
    return (
      <div className={cn(stitchTransactions.dayCard, 'flex flex-col gap-2 p-1')}>
        {header}
        <div className="flex flex-col gap-2">{rows}</div>
      </div>
    );
  }

  return (
    <Card className={cn(getCardVariantStyles(variant))}>
      {header}
      <div className={transactionStyles.groupedCard.rowContainer}>{rows}</div>
    </Card>
  );
}

export const GroupedTransactionCard = memo(GroupedTransactionCardInner);
