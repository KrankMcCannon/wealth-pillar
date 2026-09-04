'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Amount } from '@/components/ui/primitives/amount';
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
        <ul className="m-0 flex list-none flex-col p-0">
          {upcoming.map((item) => {
            const when =
              item.daysUntilDue < 0
                ? tSeries('due.daysAgo', { count: Math.abs(item.daysUntilDue) })
                : item.daysUntilDue === 0
                  ? tSeries('due.today')
                  : item.daysUntilDue === 1
                    ? tSeries('due.tomorrow')
                    : tSeries('due.inDays', { count: item.daysUntilDue });
            const handleEditSeries = () => onEditRecurringSeries(item);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={handleEditSeries}
                  className="flex min-h-10 w-full items-center justify-between gap-3 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-foreground">
                      {item.description}
                    </span>
                    <span className="block text-xs text-muted-foreground">{when}</span>
                  </span>
                  <Amount
                    type={item.type === 'income' ? 'income' : 'expense'}
                    size="sm"
                    emphasis="strong"
                    className="shrink-0"
                  >
                    {item.type === 'expense' ? -Math.abs(item.amount) : Math.abs(item.amount)}
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
