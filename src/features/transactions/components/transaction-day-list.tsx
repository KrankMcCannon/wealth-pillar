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

"use client";

import { SectionHeader } from "@/components/layout";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui";
import { Transaction, Category } from "@/lib";
import { GroupedTransactionCard } from "./grouped-transaction-card";
import { transactionStyles } from "../theme/transaction-styles";
import { formatCurrency } from "@/lib/utils/currency-formatter";
import { FileText, type LucideIcon } from "lucide-react";

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
  variant?: "regular" | "recurrent";
  
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
  sectionHeaderClassName = "mb-4",
  emptyIcon = FileText,
  emptyTitle = "Nessuna Transazione",
  emptyDescription = "Non ci sono transazioni da visualizzare",
  showViewAll = false,
  viewAllLabel = "Vedi tutte",
  onViewAll,
  variant = "regular",
  expensesOnly = false,
  className,
  onEditTransaction,
  onDeleteTransaction,
}: Readonly<TransactionDayListProps>) {
  const hasTransactions = groupedTransactions.length > 0;

  return (
    <section className={className}>
      {/* Optional Section Header */}
      {sectionTitle && (
        <SectionHeader
          title={sectionTitle}
          subtitle={sectionSubtitle}
          className={sectionHeaderClassName}
        />
      )}

      {/* Transactions List */}
      <div className="space-y-6">
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
                      <span className={transactionStyles.dayGroup.statsTotalLabel}>
                        Totale:
                      </span>
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
                      {count} {count === 1 ? "transazione" : "transazioni"}
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
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        )}
      </div>

      {/* View All Button */}
      {showViewAll && hasTransactions && onViewAll && (
        <div className="flex justify-center mt-6">
          <Button
            variant="ghost"
            size="sm"
            className="group"
            onClick={onViewAll}
          >
            <span className="mr-2 text-primary">{viewAllLabel}</span>
            <span className="group-hover:translate-x-0.5 transition-transform duration-200 text-primary">
              →
            </span>
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
const SKELETON_GROUP_KEYS = ['skeleton-group-a', 'skeleton-group-b', 'skeleton-group-c', 'skeleton-group-d', 'skeleton-group-e'];
const SKELETON_TX_KEYS = ['skeleton-tx-1', 'skeleton-tx-2'];

/**
 * Skeleton loader for TransactionDayList
 */
export function TransactionDayListSkeleton({
  itemCount = 3,
  showHeader = false,
}: TransactionDayListSkeletonProps) {
  return (
    <section className="space-y-6">
      {showHeader && (
        <div className="mb-4">
          <div className="h-5 w-40 bg-primary/15 rounded animate-pulse" />
          <div className="h-4 w-32 bg-primary/10 rounded animate-pulse mt-1" />
        </div>
      )}
      
      {SKELETON_GROUP_KEYS.slice(0, itemCount).map((groupKey) => (
        <div key={groupKey} className="space-y-3">
          {/* Day header skeleton */}
          <div className="flex justify-between items-center">
            <div className="h-4 w-24 bg-primary/15 rounded animate-pulse" />
            <div className="text-right">
              <div className="h-4 w-16 bg-primary/15 rounded animate-pulse" />
              <div className="h-3 w-20 bg-primary/10 rounded animate-pulse mt-1" />
            </div>
          </div>
          
          {/* Transaction cards skeleton */}
          <div className="bg-card rounded-xl border border-primary/20 p-3 space-y-3">
            {SKELETON_TX_KEYS.map((txKey) => (
              <div key={`${groupKey}-${txKey}`} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/12 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-primary/15 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-primary/10 rounded animate-pulse" />
                </div>
                <div className="h-5 w-16 bg-primary/15 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
