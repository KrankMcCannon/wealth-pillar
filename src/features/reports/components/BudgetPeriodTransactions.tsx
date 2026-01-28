"use client";

import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from "lucide-react";
import { Amount } from "@/components/ui/primitives";
import { reportsStyles, getBudgetPeriodTransactionIconStyle } from "@/styles/system";
import type { Transaction, Category } from "@/lib/types";
import { FinanceLogicService } from "@/server/services/finance-logic.service";
import { formatDateShort } from "@/lib/utils";

interface BudgetPeriodTransactionsProps {
  transactions?: Transaction[];
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
  const styles = reportsStyles.budgetPeriodCard;

  return (
    <div className={styles.transactionsContainer}>
      <div className={styles.transactionsBody}>
        <div className="flex items-center justify-between mb-4">
          <p className={styles.transactionsTitle}>Transazioni ({totalCount})</p>
          <a
            href={`/transactions?startDate=${startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate}&endDate=${endDate instanceof Date ? endDate.toISOString().split('T')[0] : (endDate || '')}`}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Vedi tutte <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>

        {showEmptyState ? (
          <p className={styles.transactionsEmpty}>Nessuna transazione in questo periodo</p>
        ) : (
          <div className={styles.transactionsList}>
            {transactions?.map((transaction) => {
              const categoryLabel = FinanceLogicService.getCategoryLabel(categories, transaction.category);
              const categoryColor = FinanceLogicService.getCategoryColor(categories, transaction.category);

              const getTransactionIcon = () => {
                if (transaction.type === "income") return ArrowUpRight;
                if (transaction.type === "expense") return ArrowDownRight;
                return ArrowLeftRight;
              };
              const TransactionIcon = getTransactionIcon();

              return (
                <div
                  key={transaction.id}
                  className={styles.transactionRow}
                >
                  {/* Transaction Icon */}
                  <div
                    className={styles.transactionIconWrap}
                    style={getBudgetPeriodTransactionIconStyle(categoryColor)}
                  >
                    <TransactionIcon className={styles.transactionIcon} />
                  </div>

                  {/* Transaction Details */}
                  <div className={styles.transactionBody}>
                    <p className={styles.transactionTitle}>{transaction.description}</p>
                    <div className={styles.transactionMetaRow}>
                      <span className={styles.transactionMeta}>{categoryLabel}</span>
                      <span className={styles.transactionMetaSeparator}>•</span>
                      <span className={styles.transactionMeta}>{formatDateShort(transaction.date)}</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <Amount type={transaction.type} size="sm" emphasis="strong" className={styles.transactionAmount}>
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
