'use client';

import { useMemo } from 'react';
import { Link } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { CategoryBadge } from '@/components/ui';
import { SectionHeader } from '@/components/layout';
import { HomeAmount, HomeSectionCard } from '@/components/home';
import { formatCurrency } from '@/lib/utils';
import { formatDateSmart, toDateTime } from '@/lib/utils/date-utils';
import type { Transaction, Category } from '@/lib/types';
import { stitchHome } from '@/styles/home-design-foundation';

interface RecentActivitySectionProps {
  transactions: Transaction[];
  categories: Category[];
}

export function RecentActivitySection({ transactions, categories }: RecentActivitySectionProps) {
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
        actions={
          transactions.length > 0 ? (
            <Link
              href="/transactions"
              className="text-xs font-semibold text-[#8fb0ff] hover:underline"
            >
              {t('recentActivityViewAll')}
            </Link>
          ) : undefined
        }
        className="pb-1"
        titleClassName={stitchHome.sectionHeaderTitle}
        subtitleClassName={stitchHome.sectionHeaderSubtitle}
      />

      {transactions.length === 0 ? (
        <p className={stitchHome.emptyWell}>{t('recentActivityEmpty')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {transactions.map((tx) => {
            const cat = categoryByKey.get(tx.category);
            const txDate = toDateTime(tx.date);
            const dateLabel = txDate?.isValid
              ? formatDateSmart(txDate.toISODate() || '', locale)
              : null;
            const timeLabel = txDate?.isValid ? txDate.setLocale(locale).toFormat('HH:mm') : null;
            const meta = [cat?.label ?? tx.category, dateLabel, timeLabel]
              .filter(Boolean)
              .join(' • ');
            return (
              <Link key={tx.id} href="/transactions" className={stitchHome.listRowInteractive}>
                <div className="flex min-w-0 items-center gap-3">
                  <CategoryBadge categoryKey={tx.category} color={cat?.color ?? ''} size="md" />
                  <div className="min-w-0">
                    <p className={stitchHome.rowTitle}>{tx.description}</p>
                    <p className={stitchHome.rowMeta}>{meta}</p>
                  </div>
                </div>
                <HomeAmount variant={tx.type === 'income' ? 'income' : 'expense'}>
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(Math.abs(tx.amount))}
                </HomeAmount>
              </Link>
            );
          })}
        </div>
      )}
    </HomeSectionCard>
  );
}
