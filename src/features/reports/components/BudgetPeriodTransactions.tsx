'use client';

import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react';
import { Amount } from '@/components/ui/primitives';
import { reportsStyles, getBudgetPeriodTransactionIconStyle } from '@/styles/system';
import type { Transaction, Category } from '@/lib/types';
import { FinanceLogicService } from '@/server/services/finance-logic.service';
import { formatDateShort } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface BudgetPeriodTransactionsProps {
  transactions?: Transaction[] | undefined;
  totalCount: number;
  startDate: string | Date;
  endDate: string | Date | null;
  categories: Category[];
  showEmptyState: boolean;
}

export function BudgetPeriodTransactions({
  transactions,
  totalCount,
  startDate,
  endDate,
  categories,
  showEmptyState,
}: Readonly<BudgetPeriodTransactionsProps>) {
  const t = useTranslations('Reports.BudgetPeriodTransactions');
  const styles = reportsStyles.budgetPeriodCard;

  const startStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
  const endStr = endDate
    ? endDate instanceof Date
      ? endDate.toISOString().split('T')[0]
      : endDate
    : '';

  return (
    <div className={styles.transactionsContainer}>
      <div className={styles.transactionsBody}>
        <div className="flex items-center justify-between mb-4">
          <p className={styles.transactionsTitle}>{t('title', { count: totalCount })}</p>
          <a
            href={`/transactions?startDate=${startStr}&endDate=${endStr}`}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            {t('viewAll')} <ArrowUpRight className="h-3 w-3" aria-hidden />
          </a>
        </div>

        {showEmptyState ? (
          <p className={styles.transactionsEmpty}>{t('empty')}</p>
        ) : (
          <div className={styles.transactionsList}>
            {transactions?.map((transaction) => {
              const categoryLabel = FinanceLogicService.getCategoryLabel(
                categories,
                transaction.category
              );
              const categoryColor = FinanceLogicService.getCategoryColor(
                categories,
                transaction.category
              );

              const TransactionIcon =
                transaction.type === 'income'
                  ? ArrowUpRight
                  : transaction.type === 'expense'
                    ? ArrowDownRight
                    : ArrowLeftRight;

              return (
                <div key={transaction.id} className={styles.transactionRow}>
                  <div
                    className={styles.transactionIconWrap}
                    style={getBudgetPeriodTransactionIconStyle(categoryColor)}
                  >
                    <TransactionIcon className={styles.transactionIcon} aria-hidden />
                  </div>

                  <div className={styles.transactionBody}>
                    <p className={styles.transactionTitle}>{transaction.description}</p>
                    <div className={styles.transactionMetaRow}>
                      <span className={styles.transactionMeta}>{categoryLabel}</span>
                      <span className={styles.transactionMetaSeparator} aria-hidden>
                        •
                      </span>
                      <span className={styles.transactionMeta}>
                        {formatDateShort(transaction.date)}
                      </span>
                    </div>
                  </div>

                  <Amount
                    type={transaction.type}
                    size="sm"
                    emphasis="strong"
                    className={styles.transactionAmount}
                  >
                    {transaction.amount}
                  </Amount>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
