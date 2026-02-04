/**
 * TransactionDayList Component
 *
 * Unified component for displaying transactions grouped by day.
 * Used by both Transactions and Budgets pages.
 *
 * @example
 * // Basic usage in Transactions page
 * <TransactionDayList
 *   groupedTransactions={dayTotals}
 *   accountNames={accountNames}
 *   categories={categories}
 *   onEditTransaction={handleEdit}
 *   onDeleteTransaction={handleDelete}
 * />
 *
 * @example
 * // With header in Budgets page
 * <TransactionDayList
 *   groupedTransactions={groupedTransactions}
 *   accountNames={accountNames}
 *   categories={categories}
 *   sectionTitle="Transazioni Budget"
 *   sectionSubtitle="01/12/2024 - 31/12/2024"
 *   showViewAll
 *   onViewAll={() => router.push('/transactions')}
 *   onEditTransaction={handleEdit}
 *   onDeleteTransaction={handleDelete}
 * />
 */

'use client';

import { SectionHeader } from '@/components/layout';
import { EmptyState } from '@/components/shared';
import { Button } from '@/components/ui';
import { Transaction, Category } from '@/lib';
import { GroupedTransactionCard } from './grouped-transaction-card';
import { transactionStyles } from '@/styles/system';
import { formatCurrency, cn } from '@/lib/utils';
import { FileText, type LucideIcon } from 'lucide-react';

/**
 * Grouped transaction structure
 * Each group represents transactions for a single day
 *
 * Supports two formats:
 * 1. Simple: { date: "Lun 15 Gen 2025", transactions, total } - used by TransactionService
 * 2. Extended: { date: "2025-01-15", formattedDate: "Lun 15 Gen 2025", transactions, total } - for sorting by ISO date
 */
export interface GroupedTransaction {
  /**
   * Date string - can be:
   * - Formatted date label (e.g., "Oggi", "Ieri", "Lun 15 Gen 2025")
   * - ISO date string (YYYY-MM-DD) when formattedDate is provided
   */
  date: string;
  /** Optional human-readable formatted date (if date is ISO format) */
  formattedDate?: string;
  /** Transactions for this day */
  transactions: Transaction[];
  /** Net total for the day (income - expenses) or just expenses for budgets */
  total: number;
  /** Transaction count (optional, calculated if not provided) */
  count?: number;
}

export interface TransactionDayListProps {
  /** Array of transactions grouped by day */
  groupedTransactions: GroupedTransaction[];
  /** Map of account IDs to account names for display */
  accountNames: Record<string, string>;
  /** Categories for displaying labels and icons */
  categories: Category[];

  // Optional section header
  /** Title for the section header */
  sectionTitle?: string;
  /** Subtitle for the section header */
  sectionSubtitle?: string;
  /** Custom class for section header */
  sectionHeaderClassName?: string;

  // Empty state customization
  /** Icon for empty state */
  emptyIcon?: LucideIcon;
  /** Title for empty state */
  emptyTitle?: string;
  /** Description for empty state */
  emptyDescription?: string;

  // View all button (for budget page)
  /** Whether to show the "View All" button */
  showViewAll?: boolean;
  /** Label for view all button */
  viewAllLabel?: string;
  /** Callback when "View All" is clicked */
  onViewAll?: () => void;

  // Transaction card variant
  /** Variant for transaction cards */
  variant?: 'regular' | 'recurrent';

  // Style customization
  /** Whether totals are always negative (expenses only, like budgets) */
  expensesOnly?: boolean;
  /** Custom container className */
  className?: string;

  // Callbacks
  /** Callback when a transaction is clicked for editing */
  onEditTransaction: (transaction: Transaction) => void;
  /** Callback when delete is clicked */
  onDeleteTransaction: (transactionId: string) => void;
}

export function TransactionDayList({
  groupedTransactions,
  accountNames,
  categories,
  sectionTitle,
  sectionSubtitle,
  sectionHeaderClassName,
  emptyIcon = FileText,
  emptyTitle = 'Nessuna Transazione',
  emptyDescription = 'Non ci sono transazioni da visualizzare',
  showViewAll = false,
  viewAllLabel = 'Vedi tutte',
  onViewAll,
  variant = 'regular',
  expensesOnly = false,
  className,
  onEditTransaction,
  onDeleteTransaction,
}: Readonly<TransactionDayListProps>) {
  const hasTransactions = groupedTransactions.length > 0;

  const headerClassName = cn(transactionStyles.dayList.sectionHeader, sectionHeaderClassName);

  return (
    <section className={className}>
      {/* Optional Section Header */}
      {sectionTitle && (
        <SectionHeader
          title={sectionTitle}
          subtitle={sectionSubtitle}
          className={headerClassName}
        />
      )}

      {/* Transactions List */}
      <div className={transactionStyles.dayList.container}>
        {hasTransactions ? (
          groupedTransactions.map((group) => {
            const count = group.count ?? group.transactions.length;
            const total = group.total;

            return (
              <section key={group.date}>
                {/* Day Header */}
                <div className={transactionStyles.dayGroup.header}>
                  <h2 className={transactionStyles.dayGroup.title}>
                    {group.formattedDate ?? group.date}
                  </h2>
                  <div className={transactionStyles.dayGroup.stats}>
                    <div className={transactionStyles.dayGroup.statsTotal}>
                      <span className={transactionStyles.dayGroup.statsTotalLabel}>Totale:</span>
                      <span
                        className={`${transactionStyles.dayGroup.statsTotalValue} ${
                          expensesOnly || total < 0
                            ? transactionStyles.dayGroup.statsTotalValueNegative
                            : transactionStyles.dayGroup.statsTotalValuePositive
                        }`}
                      >
                        {formatCurrency(Math.abs(total))}
                      </span>
                    </div>
                    <div className={transactionStyles.dayGroup.statsCount}>
                      {count} {count === 1 ? 'transazione' : 'transazioni'}
                    </div>
                  </div>
                </div>

                {/* Transaction Cards */}
                <GroupedTransactionCard
                  transactions={group.transactions}
                  accountNames={accountNames}
                  categories={categories}
                  variant={variant}
                  onEditTransaction={onEditTransaction}
                  onDeleteTransaction={onDeleteTransaction}
                />
              </section>
            );
          })
        ) : (
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
        )}
      </div>

      {/* View All Button */}
      {showViewAll && hasTransactions && onViewAll && (
        <div className={transactionStyles.dayList.viewAllWrap}>
          <Button
            variant="ghost"
            size="sm"
            className={transactionStyles.dayList.viewAllButton}
            onClick={onViewAll}
          >
            <span className={transactionStyles.dayList.viewAllLabel}>{viewAllLabel}</span>
            <span className={transactionStyles.dayList.viewAllArrow}>→</span>
          </Button>
        </div>
      )}
    </section>
  );
}

interface TransactionDayListSkeletonProps {
  readonly itemCount?: number;
  readonly showHeader?: boolean;
}

// Stable keys for skeleton items
const SKELETON_GROUP_KEYS = [
  'skeleton-group-a',
  'skeleton-group-b',
  'skeleton-group-c',
  'skeleton-group-d',
  'skeleton-group-e',
];
const SKELETON_TX_KEYS = ['skeleton-tx-1', 'skeleton-tx-2'];

/**
 * Skeleton loader for TransactionDayList
 */
export function TransactionDayListSkeleton({
  itemCount = 3,
  showHeader = false,
}: TransactionDayListSkeletonProps) {
  return (
    <section className={transactionStyles.dayList.skeleton.container}>
      {showHeader && (
        <div className={transactionStyles.dayList.skeleton.header}>
          <div className={transactionStyles.dayList.skeleton.headerTitle} />
          <div className={transactionStyles.dayList.skeleton.headerSubtitle} />
        </div>
      )}

      {SKELETON_GROUP_KEYS.slice(0, itemCount).map((groupKey) => (
        <div key={groupKey} className={transactionStyles.dayList.skeleton.group}>
          {/* Day header skeleton */}
          <div className={transactionStyles.dayList.skeleton.groupHeader}>
            <div className={transactionStyles.dayList.skeleton.groupTitle} />
            <div className={transactionStyles.dayList.skeleton.groupTotal}>
              <div className={transactionStyles.dayList.skeleton.groupTotalLine} />
              <div className={transactionStyles.dayList.skeleton.groupTotalSub} />
            </div>
          </div>

          {/* Transaction cards skeleton */}
          <div className={transactionStyles.dayList.skeleton.card}>
            {SKELETON_TX_KEYS.map((txKey) => (
              <div key={`${groupKey}-${txKey}`} className={transactionStyles.dayList.skeleton.row}>
                <div className={transactionStyles.dayList.skeleton.rowIcon} />
                <div className={transactionStyles.dayList.skeleton.rowBody}>
                  <div className={transactionStyles.dayList.skeleton.rowTitle} />
                  <div className={transactionStyles.dayList.skeleton.rowSubtitle} />
                </div>
                <div className={transactionStyles.dayList.skeleton.rowAmount} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
