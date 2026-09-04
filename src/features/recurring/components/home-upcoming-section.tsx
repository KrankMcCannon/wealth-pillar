'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Amount } from '@/components/ui/primitives/amount';
import { PlainListRow } from '@/components/ui/layout/plain-list-row';
import { buildRecurringView } from '@/lib/recurring/recurring-view';
import type { RecurringTransactionSeries } from '@/lib/types';
import { stitchHome } from '@/styles/home-design-foundation';
import { cn } from '@/lib/utils';

const UPCOMING_MAX_ITEMS = 5;

interface HomeUpcomingSectionProps {
  series: RecurringTransactionSeries[];
  selectedUserId?: string | undefined;
  onEditRecurringSeries: (series: RecurringTransactionSeries) => void;
}

export function HomeUpcomingSection({
  series,
  selectedUserId,
  onEditRecurringSeries,
}: HomeUpcomingSectionProps) {
  const t = useTranslations('HomeContent');
  const tSeries = useTranslations('Recurring.SeriesCard');

  const upcoming = useMemo(() => {
    const view = buildRecurringView(series, {
      ...(selectedUserId ? { selectedUserId } : {}),
    });
    return view.upcomingSeries.slice(0, UPCOMING_MAX_ITEMS);
  }, [selectedUserId, series]);

  return (
    <section aria-labelledby="home-upcoming-heading" className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="home-upcoming-heading"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          {t('upcomingTitle')}
        </h2>
        <Link
          href="/transactions?tab=Recurrent"
          className={cn(stitchHome.viewAllLink, 'min-h-8 min-w-0 py-0')}
        >
          {t('upcomingViewAll')}
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('upcomingEmpty')}</p>
      ) : (
        <ul className={stitchHome.plainList}>
          {upcoming.map((item) => {
            const when =
              item.daysUntilDue < 0
                ? tSeries('due.daysAgo', { count: Math.abs(item.daysUntilDue) })
                : item.daysUntilDue === 0
                  ? tSeries('due.today')
                  : item.daysUntilDue === 1
                    ? tSeries('due.tomorrow')
                    : tSeries('due.inDays', { count: item.daysUntilDue });
            return (
              <li key={item.id}>
                <PlainListRow
                  title={item.description}
                  meta={when}
                  onClick={() => onEditRecurringSeries(item)}
                >
                  <Amount
                    type={item.type === 'income' ? 'income' : 'expense'}
                    size="sm"
                    emphasis="strong"
                  >
                    {item.type === 'expense' ? -Math.abs(item.amount) : Math.abs(item.amount)}
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
