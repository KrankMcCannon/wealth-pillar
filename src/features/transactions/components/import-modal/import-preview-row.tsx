'use client';

import { memo, useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge, Checkbox } from '@/components/ui';
import { CategorySelect } from '@/components/form/category-select';
import type { Category } from '@/lib/types';
import type { PrepareImportRowResult } from '@/lib/import';
import { formatCurrency, formatDateShort, cn } from '@/lib/utils';
import { stitchHome } from '@/styles/home-design-foundation';

export type PreviewRow = PrepareImportRowResult & {
  include: boolean;
  category: string;
};

function statusBadgeVariant(status: PrepareImportRowResult['status']) {
  if (status === 'duplicate') return 'secondary' as const;
  if (status === 'possible-duplicate') return 'outline' as const;
  return 'default' as const;
}

interface ImportPreviewRowProps {
  row: PreviewRow;
  categories: Category[];
  t: ReturnType<typeof useTranslations<'Transactions.ImportModal'>>;
  onToggleInclude: (rowId: string, checked: boolean) => void;
  onCategoryChange: (rowId: string, category: string) => void;
}

function ImportPreviewRowComponent({
  row,
  categories,
  t,
  onToggleInclude,
  onCategoryChange,
}: Readonly<ImportPreviewRowProps>) {
  const locale = useLocale();

  const formattedDate = useMemo(() => formatDateShort(row.date, locale), [locale, row.date]);

  const handleCategoryValueChange = useCallback(
    (value: string) => onCategoryChange(row.rowId, value),
    [onCategoryChange, row.rowId]
  );

  const isIncome = row.type === 'income';

  return (
    <div className="rounded-lg border border-border/60 p-3 text-sm">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={row.include}
          onCheckedChange={(checked) => onToggleInclude(row.rowId, checked === true)}
          aria-label={t('preview.includeRow')}
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className={stitchHome.rowTitle} title={row.description}>
                {row.description}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge variant={statusBadgeVariant(row.status)}>{t(`status.${row.status}`)}</Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'border-transparent',
                    isIncome ? 'bg-income/12 text-income' : 'bg-expense/12 text-expense'
                  )}
                >
                  {isIncome ? t('preview.typeIncome') : t('preview.typeExpense')}
                </Badge>
                {row.likelyInternalTransfer ? (
                  <Badge variant="outline">{t('preview.internalTransfer')}</Badge>
                ) : null}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={cn(
                  'text-sm font-bold tabular-nums tracking-tight',
                  isIncome ? stitchHome.amountIncome : stitchHome.amountExpense
                )}
              >
                {formatCurrency(Math.abs(row.amount))}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formattedDate}</p>
            </div>
          </div>
          {row.suggestedRecurringSeriesDescription ? (
            <p
              className="truncate text-xs text-muted-foreground"
              title={row.suggestedRecurringSeriesDescription}
            >
              {t('preview.recurringMatch', {
                description: row.suggestedRecurringSeriesDescription,
              })}
            </p>
          ) : null}
          <div className="min-w-0 pt-1">
            <CategorySelect
              value={row.category}
              onValueChange={handleCategoryValueChange}
              categories={categories}
              captionLabel={t('preview.category')}
              showRecentCategories={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Preview list can hold up to 1500+ rows (see prepareImportSchema max). Memoized so toggling one
 * row's checkbox/category doesn't re-render the others — `previewRows.map` in the parent preserves
 * referential equality for untouched rows, which this relies on.
 */
export const ImportPreviewRow = memo(ImportPreviewRowComponent);
