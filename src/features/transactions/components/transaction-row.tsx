'use client';

import { Transaction } from '@/lib';
import { formatCurrency } from '@/lib/utils';
import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Amount } from '@/components/ui/primitives/amount';
import { PlainListRow } from '@/components/ui/layout/plain-list-row';

interface TransactionRowProps {
  transaction: Transaction;
  onEditTransaction?: ((transaction: Transaction) => void) | undefined;
  getCategoryLabel: (key: string) => string;
}

export const TransactionRow = memo(function TransactionRow({
  transaction,
  onEditTransaction,
  getCategoryLabel,
}: TransactionRowProps) {
  const t = useTranslations('Transactions.Table');
  const amountLabel = formatCurrency(Math.abs(transaction.amount));
  const meta = getCategoryLabel(transaction.category);

  return (
    <PlainListRow
      title={transaction.description}
      meta={meta}
      onClick={onEditTransaction ? () => onEditTransaction(transaction) : undefined}
      testId={`transaction-row-${transaction.id}`}
      ariaLabel={t('actions.editAria', {
        description: transaction.description,
        amount: amountLabel,
      })}
    >
      <Amount
        type={
          transaction.type === 'income'
            ? 'income'
            : transaction.type === 'expense'
              ? 'expense'
              : 'neutral'
        }
        size="md"
        emphasis="strong"
      >
        {transaction.type === 'expense'
          ? -Math.abs(transaction.amount)
          : Math.abs(transaction.amount)}
      </Amount>
    </PlainListRow>
  );
});

TransactionRow.displayName = 'TransactionRow';
