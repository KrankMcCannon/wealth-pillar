'use client';

import { Transaction } from '@/lib';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';
import { memo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Amount } from '@/components/ui/primitives/amount';
import { PlainListRow } from '@/components/ui/layout/plain-list-row';

interface TransactionRowProps {
  transaction: Transaction;
  onEditTransaction?: ((transaction: Transaction) => void) | undefined;
  getCategoryLabel: (key: string) => string;
  accountNames?: Record<string, string> | undefined;
  selectedAccountId?: string | undefined;
}

export const TransactionRow = memo(function TransactionRow({
  transaction,
  onEditTransaction,
  getCategoryLabel,
  accountNames,
  selectedAccountId,
}: TransactionRowProps) {
  const t = useTranslations('Transactions.Table');
  const locale = useLocale();
  const isOutgoing =
    transaction.type === 'expense' ||
    (transaction.type === 'transfer' && selectedAccountId === transaction.account_id);
  const signedAmount = isOutgoing ? -Math.abs(transaction.amount) : Math.abs(transaction.amount);
  const amountLabel = formatCurrencyLocale(signedAmount, locale);
  const direction =
    transaction.type === 'transfer' && accountNames
      ? t('transferDirection', {
          from: accountNames[transaction.account_id] ?? t('accountFallback'),
          to: accountNames[transaction.to_account_id ?? ''] ?? t('accountFallback'),
        })
      : '';
  const meta = [
    getCategoryLabel(transaction.category),
    direction || accountNames?.[transaction.account_id],
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <PlainListRow
      title={transaction.description}
      meta={meta}
      onClick={onEditTransaction ? () => onEditTransaction(transaction) : undefined}
      testId={`transaction-row-${transaction.id}`}
      ariaLabel={
        t('actions.editAria', {
          description: transaction.description,
          amount: amountLabel,
        }) + (direction ? ' · ' + direction : '')
      }
    >
      <span className="inline-flex items-baseline gap-0.5">
        {transaction.type === 'transfer' && (!selectedAccountId || selectedAccountId === 'all') ? (
          <span aria-hidden>↔</span>
        ) : !isOutgoing ? (
          <span aria-hidden>+</span>
        ) : null}
        <Amount
          type={
            transaction.type === 'income'
              ? 'income'
              : transaction.type === 'expense'
                ? 'expense'
                : 'neutral'
          }
          locale={locale}
          size="md"
          emphasis="strong"
        >
          {signedAmount}
        </Amount>
      </span>
    </PlainListRow>
  );
});

TransactionRow.displayName = 'TransactionRow';
