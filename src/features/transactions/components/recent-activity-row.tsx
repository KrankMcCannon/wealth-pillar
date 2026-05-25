'use client';

import { memo } from 'react';
import { Link } from '@/i18n/routing';
import { CategoryBadge } from '@/components/ui';
import { RowCard } from '@/components/ui/layout/row-card';
import { transactionStyles } from '@/features/transactions/theme/transaction-styles';
import { stitchHome } from '@/styles/home-design-foundation';
import { formatCurrency, cn } from '@/lib/utils';
import type { Transaction } from '@/lib/types';

interface RecentActivityRowProps {
  readonly transaction: Transaction;
  readonly categoryLabel: string;
  readonly categoryColor: string;
  readonly dateLabel: string | null;
}

function RecentActivityRowInner({
  transaction,
  categoryLabel,
  categoryColor,
  dateLabel,
}: RecentActivityRowProps) {
  const metadata = (
    <>
      <span className={stitchHome.rowMeta}>{categoryLabel}</span>
      {dateLabel ? (
        <>
          <span className={transactionStyles.transactionRow.separator}>•</span>
          <span className={stitchHome.rowMeta}>{dateLabel}</span>
        </>
      ) : null}
    </>
  );

  const amountVariant =
    transaction.type === 'income'
      ? 'success'
      : transaction.type === 'expense'
        ? 'destructive'
        : 'primary';
  const valueClassName =
    transaction.type === 'income'
      ? stitchHome.amountIncome
      : transaction.type === 'expense'
        ? stitchHome.amountExpense
        : 'text-muted-foreground';

  return (
    <Link href="/transactions" className="block">
      <RowCard
        icon={<CategoryBadge categoryKey={transaction.category} color={categoryColor} size="md" />}
        iconSize="sm"
        iconColor="none"
        iconClassName="!rounded-full !bg-transparent !p-0 !shadow-none ring-0"
        title={transaction.description}
        titleClassName={stitchHome.rowTitle}
        metadata={metadata}
        primaryValue={formatCurrency(Math.abs(transaction.amount))}
        amountVariant={amountVariant}
        valueClassName={valueClassName}
        variant="regular"
        className={cn(stitchHome.listRowInteractive, 'w-full')}
        testId={`recent-activity-row-${transaction.id}`}
      />
    </Link>
  );
}

export const RecentActivityRow = memo(RecentActivityRowInner);
RecentActivityRow.displayName = 'RecentActivityRow';
