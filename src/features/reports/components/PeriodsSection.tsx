'use client';

import React, { useMemo } from 'react';
import type { ReportPeriodSummary } from '@/server/services/reports.service';
import { useTranslations } from 'next-intl';
import { PeriodCard } from './PeriodCard';
import { EmptyState } from '@/components/shared';

interface PeriodsSectionProps {
  data: ReportPeriodSummary[];
  users: { id: string; name: string }[];
}

export function PeriodsSection({ data, users }: PeriodsSectionProps) {
  const t = useTranslations('Reports.PeriodsSection');

  const periodsByUserId = useMemo(() => {
    const m = new Map<string, ReportPeriodSummary[]>();
    for (const p of data) {
      const list = m.get(p.userId) ?? [];
      list.push(p);
      m.set(p.userId, list);
    }
    return m;
  }, [data]);

  return (
    <div className="space-y-4">
      {data.length === 0 ? (
        <EmptyState title={t('empty')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {users.map((user) => {
            const userPeriods = periodsByUserId.get(user.id) ?? [];
            if (userPeriods.length === 0) return null;

            return (
              <React.Fragment key={user.id}>
                {userPeriods.map((period) => (
                  <div key={period.id} className="relative">
                    <PeriodCard period={period} />
                    {users.length > 1 && (
                      <div className="absolute top-3 right-3 bg-card border border-primary/20 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium text-primary/70">
                        {user.name}
                      </div>
                    )}
                  </div>
                ))}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
