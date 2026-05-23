'use client';

import { Badge, CategoryBadge } from '@/components/ui';
import { Transaction } from '@/lib';
import { formatCurrency, cn } from '@/lib/utils';
import { memo } from 'react';
import { RowCard } from '@/components/ui/layout/row-card';
import {
  transactionStyles,
  getTransactionBadgeColor,
} from '@/features/transactions/theme/transaction-styles';
import { stitchHome } from '@/styles/home-design-foundation';

interface TransactionRowProps {
  transaction: Transaction;
  accountNames: Record<string, string>;
  variant: 'regular' | 'recurrent';
  context: 'due' | 'informative';
  onEditTransaction?: ((transaction: Transaction) => void) | undefined;
  getCategoryLabel: (key: string) => string;
  getCategoryColor: (key: string) => string;
}

/**
 * Individual Transaction Row Component
 * Thin wrapper that maps transaction-specific props to RowCard's generic API.
 */
export const TransactionRow = memo(
  ({
    transaction,
    accountNames,
    variant,
    context,
    onEditTransaction,
    getCategoryLabel,
    getCategoryColor,
  }: TransactionRowProps) => {
    // Calculate days until due for recurrent transactions
    const getDaysUntilDue = (): number => {
      if (!transaction.frequency || transaction.frequency === 'once') return Infinity;
      return 0;
    };

    const daysUntilDue = getDaysUntilDue();

    // Build metadata section (category + account/frequency)
    const metadata = (
      <>
        <span className={stitchHome.rowMeta}>{getCategoryLabel(transaction.category)}</span>

        {/* Account name for regular transactions */}
        {variant === 'regular' &&
          transaction.account_id &&
          accountNames[transaction.account_id] && (
            <>
              <span className={transactionStyles.transactionRow.separator}>•</span>
              <span className={stitchHome.rowMeta}>{accountNames[transaction.account_id]}</span>
            </>
          )}

        {/* Frequency badge for recurrent transactions */}
        {variant === 'recurrent' && transaction.frequency && (
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
      variant === 'recurrent' && transaction.frequency && transaction.frequency !== 'once'
        ? transaction.frequency
        : undefined;

    const getAmountVariant = () => {
      if (variant === 'recurrent') return 'primary';
      if (transaction.type === 'income') return 'success';
      if (transaction.type === 'expense') return 'destructive';
      return 'primary';
    };

    const amountVariant = getAmountVariant();
    const valueClassName =
      transaction.type === 'income'
        ? stitchHome.amountIncome
        : transaction.type === 'expense'
          ? stitchHome.amountExpense
          : 'text-muted-foreground';

    return (
      <RowCard
        // Layout
        icon={
          <CategoryBadge
            categoryKey={transaction.category}
            color={getCategoryColor(transaction.category)}
            size="md"
          />
        }
        iconSize="sm"
        iconColor="none"
        iconClassName="!rounded-full !bg-transparent !p-0 !shadow-none ring-0"
        title={transaction.description}
        titleClassName={stitchHome.rowTitle}
        metadata={metadata}
        primaryValue={primaryValue}
        secondaryValue={secondaryValue}
        amountVariant={amountVariant}
        valueClassName={valueClassName}
        secondaryValueClassName="text-muted-foreground"
        // Interaction — hover/pressed da `listRowInteractive` (Stitch home)
        variant="regular"
        onClick={() => onEditTransaction?.(transaction)}
        className={cn(stitchHome.listRowInteractive, 'w-full')}
        testId={`transaction-row-${transaction.id}`}
      />
    );
  }
);

TransactionRow.displayName = 'TransactionRow';
