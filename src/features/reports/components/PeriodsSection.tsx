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

  // Group periods by userId
  const periodsByUser = React.useMemo(() => {
    const grouped: Record<string, ReportPeriodSummary[]> = {};
    users.forEach((u) => (grouped[u.id] = []));

    data.forEach((period) => {
      if (grouped[period.userId]) {
        grouped[period.userId].push(period);
      }
    });
    return grouped;
  }, [data, users]);

  // Filter users who have periods
  const activeUsers = users.filter((user) => (periodsByUser[user.id]?.length || 0) > 0);
  const userColumnCount = Math.max(activeUsers.length, 1);
  const usersGridStyle = {
    '--reports-user-columns': `repeat(${userColumnCount}, minmax(0, 1fr))`,
  } as React.CSSProperties;

  return (
    <div className="space-y-4">
      <h3 className={reportsStyles.periods.sectionTitle}>
        <CalendarDays className="w-5 h-5" />
        {t('title')}
      </h3>

      {data.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl border-primary/20 bg-primary/5">
          <p className="text-primary/60">{t('empty')}</p>
        </div>
      ) : (
        <div className={reportsStyles.periods.usersGrid} style={usersGridStyle}>
          {activeUsers.map((user) => (
            <section key={user.id} className={reportsStyles.periods.userColumn}>
              <header className={reportsStyles.periods.userHeader}>
                <div className={reportsStyles.periods.userAvatar}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h4 className={reportsStyles.periods.userName}>{user.name}</h4>
              </header>

              <div className={reportsStyles.periods.userPeriods}>
                {periodsByUser[user.id].map((period) => (
                  <PeriodCard key={period.id} period={period} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
