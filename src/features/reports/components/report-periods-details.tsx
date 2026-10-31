'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/types';
import type { ReportPeriodSummary } from '@/server/use-cases/reports/reports.use-cases';
import { loadReportPeriodsAction } from '../actions/report-periods-actions';
import type { ReportsDateRange } from '../utils/reporting-window';
import { BudgetPeriodSection } from './budget-period-section';

interface Props {
  window: ReportsDateRange;
  scope: string;
  users: User[];
  viewerId: string;
  hrefForPeriod: (period: ReportPeriodSummary) => string;
}

export function ReportPeriodsDetails({ window, scope, users, viewerId, hrefForPeriod }: Props) {
  const t = useTranslations('ReportsContent');
  const [state, setState] = useState<{ periods?: ReportPeriodSummary[]; error?: boolean }>({});
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadReportPeriodsAction(window)
      .then((result) => {
        if (!cancelled) setState(result.data ? { periods: result.data } : { error: true });
      })
      .catch(() => {
        if (!cancelled) setState({ error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [window, attempt]);

  if (state.error)
    return (
      <div role="alert" className="space-y-2">
        <p className="text-sm text-muted-foreground">{t('detailsError')}</p>
        <Button
          variant="outline"
          onClick={() => {
            setState({});
            setAttempt((n) => n + 1);
          }}
        >
          {t('retry')}
        </Button>
      </div>
    );
  if (!state.periods)
    return (
      <p role="status" className="min-h-11 text-sm text-muted-foreground">
        {t('detailsLoading')}
      </p>
    );
  return (
    <BudgetPeriodSection
      periods={scope === 'all' ? state.periods : state.periods.filter((p) => p.userId === scope)}
      users={users}
      viewerId={viewerId}
      hrefForPeriod={hrefForPeriod}
    />
  );
}
