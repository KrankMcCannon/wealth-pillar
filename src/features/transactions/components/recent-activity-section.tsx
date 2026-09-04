'use client';

import { useMemo } from 'react';
import { Link } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { Amount } from '@/components/ui/primitives/amount';
import { PlainListRow } from '@/components/ui/layout/plain-list-row';
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
        <ul className={stitchHome.plainList}>
          {transactions.map((tx) => {
            const category = categoryByKey.get(tx.category);
            const txDate = toDateTime(tx.date);
            const dateLabel = txDate?.isValid
              ? formatDateSmart(txDate.toISODate() || '', locale)
              : null;
            const meta = [category?.label ?? tx.category, dateLabel].filter(Boolean).join(' · ');
            return (
              <li key={tx.id}>
                <PlainListRow
                  title={tx.description}
                  meta={meta}
                  onClick={() => onEditTransaction(tx)}
                >
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
                  >
                    {tx.type === 'expense' ? -Math.abs(tx.amount) : Math.abs(tx.amount)}
                  </Amount>
                </PlainListRow>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
