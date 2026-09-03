'use client';

import { memo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Transaction, Category } from '@/lib';
import {
  getCategoryLabel as getCategoryLabelLogic,
  getCategoryColor as getCategoryColorLogic,
} from '@/server/use-cases/categories/category.logic';
import { formatCurrency } from '@/lib/utils';
import { stitchDashboardGroupedList } from '@/styles/home-design-foundation';
import { TransactionRow } from './transaction-row';
import {
  transactionStyles,
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
    <li key={transaction.id ?? `temp-${transaction.date ?? 'unknown'}-${index}`}>
      <TransactionRow
        transaction={transaction}
        accountNames={accountNames}
        variant={variant}
        context={context}
        onEditTransaction={onEditTransaction}
        getCategoryLabel={getCategoryLabel}
        getCategoryColor={getCategoryColor}
      />
    </li>
  ));

  return (
    <div className={stitchDashboardGroupedList}>
      {header}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">{rows}</ul>
    </div>
  );
}

export const GroupedTransactionCard = memo(GroupedTransactionCardInner);
