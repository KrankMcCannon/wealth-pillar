import React from 'react';
import type { ReportPeriodSummary } from '@/server/services/reports.service';
import { reportsStyles } from '@/features/reports/theme/reports-styles';
import { CalendarDays } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PeriodCard } from './PeriodCard';

interface PeriodsSectionProps {
  data: ReportPeriodSummary[];
  users: { id: string; name: string }[];
}

export function PeriodsSection({ data, users }: PeriodsSectionProps) {
  const t = useTranslations('Reports.PeriodsSection');

  return (
    <div className="space-y-4">
      <h3 className={reportsStyles.periods.sectionTitle}>
        <CalendarDays className="w-5 h-5 text-primary" />
        {t('title')}
      </h3>

      {data.length === 0 ? (
        <div className={reportsStyles.periods.emptyContainer}>
          <p className={reportsStyles.periods.emptyText}>{t('empty')}</p>
        </div>
      ) : (
        <div className={reportsStyles.periods.grid}>
          {users.map((user) => {
            const userPeriods = data.filter((p) => p.userId === user.id);
            if (userPeriods.length === 0) return null;

            return (
              <React.Fragment key={user.id}>
                {userPeriods.map((period) => (
                  <div key={period.id} className="relative group">
                    <div className="absolute -inset-0.5 bg-linear-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
                    <PeriodCard period={period} />
                    {users.length > 1 && (
                      <div className={reportsStyles.periods.userBadge}>{user.name}</div>
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
