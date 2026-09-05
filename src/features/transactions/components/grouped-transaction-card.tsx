'use client';

import { memo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Transaction, Category } from '@/lib';
import { getCategoryLabel as getCategoryLabelLogic } from '@/server/use-cases/categories/category.logic';
import { formatCurrency } from '@/lib/utils';
import { stitchHome } from '@/styles/home-design-foundation';
import { TransactionRow } from './transaction-row';
import {
  transactionStyles,
  getHeaderVariantStyles,
  getTotalAmountColor,
} from '@/features/transactions/theme/transaction-styles';

interface GroupedTransactionCardProps {
  transactions: Transaction[];
  variant?: 'regular' | 'recurrent';
  showHeader?: boolean;
  totalAmount?: number;
  categories?: Category[];
  onEditTransaction?: (transaction: Transaction) => void;
}

function GroupedTransactionCardInner({
  transactions,
  variant = 'regular',
  showHeader = false,
  totalAmount,
  categories = [],
  onEditTransaction,
}: Readonly<GroupedTransactionCardProps>) {
  const t = useTranslations('Transactions.GroupedCard');
  const getCategoryLabel = useCallback(
    (categoryKey: string) => getCategoryLabelLogic(categories, categoryKey),
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
        onEditTransaction={onEditTransaction}
        getCategoryLabel={getCategoryLabel}
      />
    </li>
  ));

  return (
    <>
      {header}
      <ul className={stitchHome.plainList}>{rows}</ul>
    </>
  );
}

export const GroupedTransactionCard = memo(GroupedTransactionCardInner);
