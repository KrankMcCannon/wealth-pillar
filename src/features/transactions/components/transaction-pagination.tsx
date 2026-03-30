'use client';

import { memo, useId } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { transactionStyles } from '@/styles/system';
import { PAGE_SIZE_OPTIONS, type PageSizeOption } from '../hooks/usePaginatedTransactions';

interface TransactionPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: PageSizeOption) => void;
  className?: string;
  /** Namespace messaggi (stesse chiavi di `Transactions.Table.pagination`) */
  messagesNamespace?: string;
}

const s = transactionStyles.transactionTable.pagination;

/**
 * Generates the page range to display.
 * Desktop: up to 7 items with ellipsis on either side.
 * Returns numbers and "..." strings.
 */
function getPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const delta = 2;
  const left = current - delta;
  const right = current + delta;
  const pages: (number | '...')[] = [];

  // Always include page 1
  pages.push(1);

  if (left > 2) pages.push('...');

  for (let i = Math.max(2, left); i <= Math.min(total - 1, right); i++) {
    pages.push(i);
  }

  if (right < total - 1) pages.push('...');

  // Always include last page
  if (total > 1) pages.push(total);

  return pages;
}

function TransactionPaginationInner({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  className,
  messagesNamespace = 'Transactions.Table.pagination',
}: TransactionPaginationProps) {
  const t = useTranslations(messagesNamespace);
  const pageSizeSelectId = useId();

  const from = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const to = Math.min(currentPage * pageSize, totalItems);

  const pageRange = getPageRange(currentPage, totalPages);

  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  return (
    <nav
      aria-label={t('page', { current: currentPage, total: totalPages })}
      className={cn(s.wrapper, className)}
    >
      {/* Left cluster: per-page selector (desktop only) + info */}
      <div className="flex items-center gap-3">
        {/* Per-page selector — hidden on mobile, visible on sm+ */}
        {onPageSizeChange && (
          <div className={cn(s.perPageWrapper, 'hidden sm:flex')}>
            <label htmlFor={pageSizeSelectId} className={s.perPageLabel}>
              {t('perPageLabel')}
            </label>
            <div className="relative">
              <select
                id={pageSizeSelectId}
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSizeOption)}
                disabled={isLoading}
                aria-label={t('perPageAriaLabel')}
                className={s.perPageSelect}
              >
                {PAGE_SIZE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {/* Custom chevron overlay */}
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-primary/50">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
                  <path
                    d="M1 3l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>
        )}

        {/* Info text */}
        <p className={s.info} aria-live="polite">
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className={s.loadingSpinner} aria-hidden />
              {t('loading')}
            </span>
          ) : (
            <span>
              <span className={s.infoHighlight}>
                {from}–{to}
              </span>{' '}
              {t('of')} <span className={s.infoHighlight}>{totalItems}</span>
            </span>
          )}
        </p>
      </div>

      {/* Right cluster: navigation controls */}
      {totalPages > 1 && (
        <div className={s.controls} role="group">
          {/* First page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={isFirst || isLoading}
            aria-label={t('first')}
            className={s.button}
          >
            <ChevronsLeft className={s.buttonIcon} aria-hidden />
          </button>

          {/* Previous page */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={isFirst || isLoading}
            aria-label={t('previous')}
            className={s.button}
          >
            <ChevronLeft className={s.buttonIcon} aria-hidden />
          </button>

          {/* Page numbers — hidden on mobile, shown on sm+ */}
          <div className="hidden sm:flex items-center gap-1">
            {pageRange.map((item, idx) =>
              item === '...' ? (
                <span key={`ellipsis-${idx}`} className={s.ellipsis} aria-hidden>
                  ···
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPageChange(item)}
                  disabled={isLoading}
                  aria-label={t('goToPage', { page: item })}
                  aria-current={item === currentPage ? 'page' : undefined}
                  className={cn(s.button, item === currentPage && s.buttonActive)}
                >
                  {item}
                </button>
              )
            )}
          </div>

          {/* Mobile: current/total indicator */}
          <span className="sm:hidden px-3 text-[13px] font-semibold text-primary tabular-nums">
            {currentPage} / {totalPages}
          </span>

          {/* Next page */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isLast || isLoading}
            aria-label={t('next')}
            className={s.button}
          >
            <ChevronRight className={s.buttonIcon} aria-hidden />
          </button>

          {/* Last page */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={isLast || isLoading}
            aria-label={t('last')}
            className={s.button}
          >
            <ChevronsRight className={s.buttonIcon} aria-hidden />
          </button>
        </div>
      )}
    </nav>
  );
}

export const TransactionPagination = memo(TransactionPaginationInner);
