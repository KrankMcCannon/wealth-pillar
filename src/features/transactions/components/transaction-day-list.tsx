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
 * />
 */

'use client';

import { SectionHeader } from '@/components/layout';
import { EmptyState } from '@/components/shared';
import { Transaction, Category } from '@/lib';
import { GroupedTransactionCard } from './grouped-transaction-card';
import { transactionStyles } from '@/features/transactions/theme/transaction-styles';
import { stitchHome } from '@/styles/home-design-foundation';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionDayGroupSkeleton } from '@/components/ui/primitives/skeletons';
import { formatCurrency, cn } from '@/lib/utils';
import { FileText, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
}

export function TransactionDayList({
  groupedTransactions,
  accountNames,
  categories,
  sectionTitle,
  sectionSubtitle,
  sectionHeaderClassName,
  emptyIcon = FileText,
  emptyTitle,
  emptyDescription,
  showViewAll = false,
  viewAllLabel,
  onViewAll,
  variant = 'regular',
  expensesOnly = false,
  className,
  onEditTransaction,
}: Readonly<TransactionDayListProps>) {
  const t = useTranslations('Transactions.DayList');
  const hasTransactions = groupedTransactions.length > 0;
  const resolvedEmptyTitle = emptyTitle ?? t('empty.title');
  const resolvedEmptyDescription = emptyDescription ?? t('empty.description');
  const resolvedViewAllLabel = viewAllLabel ?? t('viewAll');

  const DayHeadingTag = sectionTitle ? 'h4' : 'h3';

  const headerClassName = cn(transactionStyles.dayList.sectionHeader, sectionHeaderClassName);

  const renderGroup = (group: GroupedTransaction) => {
    const count = group.count ?? group.transactions.length;
    const total = group.total;
    return (
      <section key={group.date}>
        <div className={transactionStyles.dayGroup.header}>
          <DayHeadingTag className={transactionStyles.dayGroup.title}>
            {group.formattedDate ?? group.date}
          </DayHeadingTag>
          <div className={transactionStyles.dayGroup.stats}>
            <div className={transactionStyles.dayGroup.statsTotal}>
              <span className={transactionStyles.dayGroup.statsTotalLabel}>{t('totalLabel')}</span>
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
            <div className={transactionStyles.dayGroup.statsCount}>{t('count', { count })}</div>
          </div>
        </div>
        <GroupedTransactionCard
          transactions={group.transactions}
          accountNames={accountNames}
          categories={categories}
          variant={variant}
          onEditTransaction={onEditTransaction}
        />
      </section>
    );
  };

  return (
    <section className={className}>
      {/* Optional Section Header */}
      {sectionTitle && (
        <SectionHeader
          titleAs="h3"
          title={sectionTitle}
          subtitle={sectionSubtitle}
          className={headerClassName}
        />
      )}

      <div className={transactionStyles.dayList.container}>
        {hasTransactions ? (
          groupedTransactions.map((group) => renderGroup(group))
        ) : (
          <EmptyState
            icon={emptyIcon}
            title={resolvedEmptyTitle}
            description={resolvedEmptyDescription}
          />
        )}
      </div>

      {/* View All Button */}
      {showViewAll && hasTransactions && onViewAll && (
        <div className={transactionStyles.dayList.viewAllWrap}>
          <button type="button" onClick={onViewAll} className={stitchHome.viewAllLink}>
            {resolvedViewAllLabel}
            <span className="ml-1" aria-hidden>
              →
            </span>
          </button>
        </div>
      )}
    </section>
  );
}

interface TransactionDayListSkeletonProps {
  readonly itemCount?: number;
  readonly showHeader?: boolean;
}

export function TransactionDayListSkeleton({
  itemCount = 3,
  showHeader = false,
}: TransactionDayListSkeletonProps) {
  return (
    <section className="flex flex-col gap-6 px-4 py-2" aria-busy="true">
      {showHeader ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      ) : null}
      {Array.from({ length: itemCount }, (_, index) => (
        <TransactionDayGroupSkeleton key={`day-group-skeleton-${index}`} />
      ))}
    </section>
  );
}
