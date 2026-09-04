'use client';

import { useMemo } from 'react';
import { Link } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { SectionHeader } from '@/components/layout';
import { HomeSectionCard } from '@/components/home';
import { EmptyState } from '@/components/shared';
import { formatDateSmart, toDateTime } from '@/lib/utils/date-utils';
import type { Transaction, Category } from '@/lib/types';
import { stitchDashboardGroupedList, stitchHome } from '@/styles/home-design-foundation';
import { RecentActivityRow } from './recent-activity-row';
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
    for (const c of categories) {
      map.set(c.key, c);
    }
    return map;
  }, [categories]);

  return (
    <HomeSectionCard aria-label={t('recentActivityTitle')}>
      <SectionHeader
        title={t('recentActivityTitle')}
        subtitle={
          transactions.length > 0
            ? t('recentActivitySubtitle', { count: transactions.length })
            : undefined
        }
        actions={
          transactions.length > 0 ? (
            <Link href="/transactions" className={stitchHome.viewAllLink}>
              {t('recentActivityViewAll')}
            </Link>
          ) : undefined
        }
        className="pb-1"
        titleClassName={stitchHome.sectionHeaderTitle}
        subtitleClassName={stitchHome.sectionHeaderSubtitle}
      />

      {transactions.length === 0 ? (
        <EmptyState variant="dashboard" title={t('recentActivityEmpty')} />
      ) : (
        <ul className={cn(stitchDashboardGroupedList, 'm-0 list-none p-0')}>
          {transactions.map((tx) => {
            const cat = categoryByKey.get(tx.category);
            const txDate = toDateTime(tx.date);
            const dateLabel = txDate?.isValid
              ? formatDateSmart(txDate.toISODate() || '', locale)
              : null;

            return (
              <li key={tx.id}>
                <RecentActivityRow
                  transaction={tx}
                  categoryLabel={cat?.label ?? tx.category}
                  categoryColor={cat?.color ?? ''}
                  dateLabel={dateLabel}
                  onEditTransaction={onEditTransaction}
                />
              </li>
            );
          })}
        </ul>
      )}
    </HomeSectionCard>
  );
}
