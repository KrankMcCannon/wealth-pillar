'use client';

import { useMemo } from 'react';
import { Link } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { Amount } from '@/components/ui/primitives/amount';
import { formatDateSmart, toDateTime } from '@/lib/utils/date-utils';
import type { Transaction, Category } from '@/lib/types';
import { stitchHome } from '@/styles/home-design-foundation';
import { cn } from '@/lib/utils';

interface RecentActivitySectionProps {
  transactions: Transaction[];
  categories: Category[];
  onEditTransaction: (transaction: Transaction) => void;
}

export function RecentActivitySection({
  transactions,
  categories,
  onEditTransaction,
}: RecentActivitySectionProps) {
  const t = useTranslations('HomeContent');
  const locale = useLocale();

  const categoryByKey = useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of categories) {
      map.set(category.key, category);
    }
    return map;
  }, [categories]);

  return (
    <section aria-labelledby="home-recent-heading" className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="home-recent-heading"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          {t('recentActivityTitle')}
        </h2>
        {transactions.length > 0 ? (
          <Link href="/transactions" className={cn(stitchHome.viewAllLink, 'min-h-8 min-w-0 py-0')}>
            {t('recentActivityViewAll')}
          </Link>
        ) : null}
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('recentActivityEmpty')}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {transactions.map((tx) => {
            const category = categoryByKey.get(tx.category);
            const txDate = toDateTime(tx.date);
            const dateLabel = txDate?.isValid
              ? formatDateSmart(txDate.toISODate() || '', locale)
              : null;
            const handleEditTrailItem = () => onEditTransaction(tx);
            const meta = [category?.label ?? tx.category, dateLabel].filter(Boolean).join(' · ');
            return (
              <li key={tx.id}>
                <button
                  type="button"
                  onClick={handleEditTrailItem}
                  className="flex min-h-10 w-full items-center justify-between gap-3 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-foreground">{tx.description}</span>
                    {meta ? (
                      <span className="block truncate text-xs text-muted-foreground">{meta}</span>
                    ) : null}
                  </span>
                  <Amount
                    type={
                      tx.type === 'income'
                        ? 'income'
                        : tx.type === 'expense'
                          ? 'expense'
                          : 'neutral'
                    }
                    size="sm"
                    emphasis="strong"
                    className="shrink-0"
                  >
                    {tx.type === 'expense' ? -Math.abs(tx.amount) : Math.abs(tx.amount)}
                  </Amount>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
