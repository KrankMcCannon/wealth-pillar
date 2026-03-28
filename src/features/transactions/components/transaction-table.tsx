'use client';

/**
 * TransactionTable Component
 *
 * Adaptive paginated layout for the Transactions page.
 * — Mobile  (< sm): card-list with SwipeableCard swipe-to-delete + tap-to-edit
 * — Desktop (≥ sm):  HTML table with always-visible delete icon, click-row-to-edit
 *
 * Features:
 * - Day-group headers (date left, daily net total right)
 * - Semantic amount coloring (income / expense / transfer)
 * - CategoryBadge per row
 * - Skeleton overlay during page transitions
 * - Integrated TransactionPagination footer
 * - Fully accessible (aria-labels, roles, aria-live)
 */

import { memo, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Trash2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { formatDateSmart, toDateTime } from '@/lib/utils/date-utils';
import { FinanceLogicService } from '@/server/services/finance-logic.service';
import { CategoryBadge } from '@/components/ui/category-badge';
import { TransactionLogic } from '@/lib/utils/transaction-logic';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { transactionStyles } from '@/styles/system';
import { TransactionPagination } from './transaction-pagination';
import { TransactionRow } from './transaction-row';
import type { PageSizeOption } from '../hooks/usePaginatedTransactions';
import type { Transaction, Category } from '@/lib/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TransactionTableProps {
  transactions: Transaction[];
  totalFilteredCount: number;
  accountNames: Record<string, string>;
  categories: Category[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  isChangingPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: PageSizeOption) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transactionId: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

// ─── Day grouping helpers ───────────────────────────────────────────────────────

interface DayGroup {
  isoDate: string;
  formattedDate: string;
  transactions: Transaction[];
  income: number;
  expense: number;
  net: number;
}

function groupByDay(transactions: Transaction[], locale: string): DayGroup[] {
  const grouped: Record<string, Transaction[]> = {};

  for (const tx of transactions) {
    const dt = toDateTime(tx.date);
    const iso = dt?.toISODate();
    if (!iso) continue;
    if (!grouped[iso]) grouped[iso] = [];
    grouped[iso].push(tx);
  }

  const dailyTotals = TransactionLogic.calculateDailyTotals(grouped);

  return Object.entries(grouped)
    .map(([iso, txs]) => ({
      isoDate: iso,
      formattedDate: formatDateSmart(iso, locale),
      transactions: txs,
      income: dailyTotals[iso]?.income ?? 0,
      expense: dailyTotals[iso]?.expense ?? 0,
      net: (dailyTotals[iso]?.income ?? 0) - (dailyTotals[iso]?.expense ?? 0),
    }))
    .sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime());
}

// ─── Amount helpers ─────────────────────────────────────────────────────────────

function getAmountClass(tx: Transaction): string {
  const s = transactionStyles.transactionTable;
  if (tx.type === 'income') return cn(s.amount, s.amountIncome);
  if (tx.type === 'expense') return cn(s.amount, s.amountExpense);
  return cn(s.amount, s.amountTransfer);
}

function getAmountPrefix(tx: Transaction): string {
  if (tx.type === 'income') return '+';
  if (tx.type === 'expense') return '−';
  return '';
}

// ─── Desktop skeleton ───────────────────────────────────────────────────────────

const SKELETON_ROWS = [70, 45, 85, 55, 75, 40, 90, 60] as const;

function TableSkeleton() {
  const sk = transactionStyles.transactionTable.skeleton;
  return (
    <TableBody aria-busy="true" aria-label="Caricamento…">
      <TableRow className={sk.dayRow}>
        <TableCell colSpan={5} className={sk.dayCell}>
          <div className={cn(sk.dayLine, 'w-24')} />
        </TableCell>
      </TableRow>
      {SKELETON_ROWS.map((w, i) => (
        <TableRow key={i} className={sk.row}>
          <TableCell className={sk.cell}>
            <div className={sk.icon} />
          </TableCell>
          <TableCell className={sk.cell}>
            <div className={cn(sk.line)} style={{ width: `${w}%` }} />
            <div className={cn(sk.lineShort, 'w-1/3')} />
          </TableCell>
          <TableCell className={cn(sk.cell, 'hidden sm:table-cell')}>
            <div className={cn(sk.line, 'w-20')} />
          </TableCell>
          <TableCell className={cn(sk.cell, 'hidden md:table-cell')}>
            <div className={cn(sk.line, 'w-16')} />
          </TableCell>
          <TableCell className={sk.cell}>
            <div className={sk.amountLine} />
          </TableCell>
          <TableCell className={sk.cell} />
        </TableRow>
      ))}
    </TableBody>
  );
}

// ─── Mobile skeleton ────────────────────────────────────────────────────────────

function MobileCardSkeleton() {
  const ms = transactionStyles.transactionTable.mobile.skeleton;
  return (
    <div className={ms.wrapper} aria-busy="true">
      {[3, 2].map((rowCount, gi) => (
        <div key={gi}>
          <div className={ms.dayHeader} />
          <div className={ms.card}>
            {Array.from({ length: rowCount }).map((_, ri) => (
              <div key={ri} className={ms.row}>
                <div className={ms.icon} />
                <div className={ms.body}>
                  <div className={ms.line} />
                  <div className={ms.lineSub} />
                </div>
                <div className={ms.amount} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Mobile day group ───────────────────────────────────────────────────────────

interface MobileDayGroupProps {
  group: DayGroup;
  accountNames: Record<string, string>;
  getCategoryLabel: (key: string) => string;
  getCategoryColor: (key: string) => string;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  t: ReturnType<typeof useTranslations<'Transactions.Table'>>;
}

function MobileDayGroup({
  group,
  accountNames,
  getCategoryLabel,
  getCategoryColor,
  onEditTransaction,
  onDeleteTransaction,
  t,
}: MobileDayGroupProps) {
  const ms = transactionStyles.transactionTable.mobile;
  const count = group.transactions.length;

  const netClass =
    group.net > 0 ? ms.dayNetPositive : group.net < 0 ? ms.dayNetNegative : ms.dayNetNeutral;

  return (
    <div>
      {/* Day header */}
      <div className={ms.dayHeader}>
        <span className={ms.dayDate}>{group.formattedDate}</span>
        <div className={ms.dayMeta}>
          <span className={ms.dayCount}>{t('dayCount', { count })}</span>
          <span className={netClass}>
            {group.net > 0 ? '+' : group.net < 0 ? '−' : ''}
            {formatCurrency(Math.abs(group.net))}
          </span>
        </div>
      </div>

      {/* Card group */}
      <div className={ms.cardGroup}>
        {group.transactions.map((tx) => (
          <TransactionRow
            key={tx.id}
            transaction={tx}
            accountNames={accountNames}
            variant="regular"
            context="informative"
            onEditTransaction={onEditTransaction}
            onDeleteTransaction={onDeleteTransaction}
            getCategoryLabel={getCategoryLabel}
            getCategoryColor={getCategoryColor}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Desktop day group rows ─────────────────────────────────────────────────────

interface DayGroupRowsProps {
  group: DayGroup;
  accountNames: Record<string, string>;
  getCategoryLabel: (key: string) => string;
  getCategoryColor: (key: string) => string;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useTranslations<'Transactions.Table'>>;
}

function DayGroupRows({
  group,
  accountNames,
  getCategoryLabel,
  getCategoryColor,
  onEdit,
  onDelete,
  t,
}: DayGroupRowsProps) {
  const s = transactionStyles.transactionTable;
  const count = group.transactions.length;

  const netClass =
    group.net > 0 ? s.dayTotalPositive : group.net < 0 ? s.dayTotalNegative : s.dayTotalNeutral;

  return (
    <>
      {/* Day separator row */}
      <TableRow className={s.dayRow} aria-label={group.formattedDate}>
        <TableCell colSpan={4} className={s.dayCell}>
          <div className="flex items-center gap-2">
            <span className={s.dayDate}>{group.formattedDate}</span>
            <span className={s.dayCount}>{t('dayCount', { count })}</span>
          </div>
        </TableCell>
        <TableCell className={cn(s.dayCell, 'text-right')}>
          <span className={netClass}>
            {group.net > 0 ? '+' : group.net < 0 ? '−' : ''}
            {formatCurrency(Math.abs(group.net))}
          </span>
        </TableCell>
        <TableCell className={s.dayCell} />
      </TableRow>

      {/* Transaction rows */}
      {group.transactions.map((tx) => (
        <DesktopTransactionRow
          key={tx.id}
          transaction={tx}
          accountNames={accountNames}
          getCategoryLabel={getCategoryLabel}
          getCategoryColor={getCategoryColor}
          onEdit={onEdit}
          onDelete={onDelete}
          t={t}
        />
      ))}
    </>
  );
}

// ─── Desktop single transaction row ────────────────────────────────────────────

interface DesktopTransactionRowProps {
  transaction: Transaction;
  accountNames: Record<string, string>;
  getCategoryLabel: (key: string) => string;
  getCategoryColor: (key: string) => string;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useTranslations<'Transactions.Table'>>;
}

const DesktopTransactionRow = memo(function DesktopTransactionRow({
  transaction: tx,
  accountNames,
  getCategoryLabel,
  getCategoryColor,
  onEdit,
  onDelete,
  t,
}: DesktopTransactionRowProps) {
  const s = transactionStyles.transactionTable;
  const accountName = tx.account_id ? accountNames[tx.account_id] : undefined;

  return (
    <TableRow className={s.row} onClick={() => onEdit(tx)} aria-label={tx.description}>
      {/* Category icon */}
      <TableCell className={cn(s.cell, 'w-10 px-4')}>
        <CategoryBadge categoryKey={tx.category} color={getCategoryColor(tx.category)} size="sm" />
      </TableCell>

      {/* Description */}
      <TableCell className={s.cell}>
        <p className={s.descriptionText}>{tx.description}</p>
        <p className={cn(s.accountText, 'sm:hidden mt-0.5')}>{getCategoryLabel(tx.category)}</p>
      </TableCell>

      {/* Category badge — hidden on mobile */}
      <TableCell className={cn(s.cell, 'hidden sm:table-cell')}>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/6 px-2.5 py-0.5 text-[11px] font-medium text-primary/70 whitespace-nowrap">
          {getCategoryLabel(tx.category)}
        </span>
      </TableCell>

      {/* Account — hidden on mobile + tablet */}
      <TableCell className={cn(s.cell, 'hidden md:table-cell')}>
        {accountName && <span className={s.accountText}>{accountName}</span>}
      </TableCell>

      {/* Amount */}
      <TableCell className={cn(s.cell, s.cellRight)}>
        <span className={getAmountClass(tx)}>
          {getAmountPrefix(tx)}
          {formatCurrency(Math.abs(tx.amount))}
        </span>
      </TableCell>

      {/* Delete action — always visible, click-row handles edit */}
      <TableCell className={s.actionCell} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(tx.id);
          }}
          aria-label={t('actions.delete')}
          className={s.actionDeleteButton}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </TableCell>
    </TableRow>
  );
});

// ─── Main Component ─────────────────────────────────────────────────────────────

function TransactionTableInner({
  transactions,
  totalFilteredCount,
  accountNames,
  categories,
  currentPage,
  totalPages,
  pageSize,
  isChangingPage,
  onPageChange,
  onPageSizeChange,
  onEditTransaction,
  onDeleteTransaction,
  emptyTitle,
  emptyDescription,
  className,
}: TransactionTableProps) {
  const t = useTranslations('Transactions.Table');
  const locale = useLocale();
  const s = transactionStyles.transactionTable;
  const ms = s.mobile;

  const getCategoryLabel = useCallback(
    (key: string) => FinanceLogicService.getCategoryLabel(categories, key),
    [categories]
  );
  const getCategoryColor = useCallback(
    (key: string) => FinanceLogicService.getCategoryColor(categories, key),
    [categories]
  );

  const dayGroups = groupByDay(transactions, locale);
  const isEmpty = transactions.length === 0 && !isChangingPage;

  const showPagination = totalPages > 1 || totalFilteredCount > 0;

  return (
    <div className={className}>
      {/* ══ Mobile layout (< sm): Card list with swipe-to-delete ══════════════ */}
      <div className={ms.wrapper}>
        {isChangingPage ? (
          <MobileCardSkeleton />
        ) : isEmpty ? (
          <div className={ms.emptyWrapper}>
            <div className={s.emptyIcon}>
              <FileText className="h-7 w-7" aria-hidden />
            </div>
            <p className={s.emptyTitle}>{emptyTitle ?? t('empty.title')}</p>
            <p className={s.emptyDescription}>{emptyDescription ?? t('empty.description')}</p>
          </div>
        ) : (
          <div className={ms.contentStack}>
            {dayGroups.map((group) => (
              <MobileDayGroup
                key={group.isoDate}
                group={group}
                accountNames={accountNames}
                getCategoryLabel={getCategoryLabel}
                getCategoryColor={getCategoryColor}
                onEditTransaction={onEditTransaction}
                onDeleteTransaction={onDeleteTransaction}
                t={t}
              />
            ))}
          </div>
        )}

        {/* Mobile pagination */}
        {showPagination && (
          <TransactionPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalFilteredCount}
            pageSize={pageSize}
            isLoading={isChangingPage}
            onPageChange={onPageChange}
            {...(onPageSizeChange && { onPageSizeChange })}
            className={ms.pagination}
          />
        )}
      </div>

      {/* ══ Desktop layout (≥ sm): Paginated table ════════════════════════════ */}
      <div className={cn('hidden sm:block', s.wrapper)}>
        <Table>
          {/* Column headers */}
          <TableHeader className={s.header}>
            <TableRow className={s.headerRow}>
              <TableHead className={cn(s.headerCell, 'w-10 px-4')} />
              <TableHead className={s.headerCell}>{t('columns.description')}</TableHead>
              <TableHead className={cn(s.headerCell, 'hidden sm:table-cell')}>
                {t('columns.category')}
              </TableHead>
              <TableHead className={cn(s.headerCell, 'hidden md:table-cell')}>
                {t('columns.account')}
              </TableHead>
              <TableHead className={cn(s.headerCell, s.headerCellRight)}>
                {t('columns.amount')}
              </TableHead>
              {/* Delete column */}
              <TableHead className={cn(s.headerCell, 'w-10')} />
            </TableRow>
          </TableHeader>

          {/* Body */}
          {isChangingPage ? (
            <TableSkeleton />
          ) : isEmpty ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="py-0">
                  <div className={s.emptyWrapper}>
                    <div className={s.emptyIcon}>
                      <FileText className="h-7 w-7" aria-hidden />
                    </div>
                    <p className={s.emptyTitle}>{emptyTitle ?? t('empty.title')}</p>
                    <p className={s.emptyDescription}>
                      {emptyDescription ?? t('empty.description')}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {dayGroups.map((group) => (
                <DayGroupRows
                  key={group.isoDate}
                  group={group}
                  accountNames={accountNames}
                  getCategoryLabel={getCategoryLabel}
                  getCategoryColor={getCategoryColor}
                  onEdit={onEditTransaction}
                  onDelete={onDeleteTransaction}
                  t={t}
                />
              ))}
            </TableBody>
          )}
        </Table>

        {/* Desktop pagination — inside wrapper for border-t separator */}
        {showPagination && (
          <TransactionPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalFilteredCount}
            pageSize={pageSize}
            isLoading={isChangingPage}
            onPageChange={onPageChange}
            {...(onPageSizeChange && { onPageSizeChange })}
          />
        )}
      </div>
    </div>
  );
}

export const TransactionTable = memo(TransactionTableInner);
