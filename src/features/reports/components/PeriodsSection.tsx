import React from 'react';
import type { ReportPeriodSummary } from '@/server/services/reports.service';
import { reportsStyles } from '@/features/reports/theme/reports-styles';
import { CalendarDays } from 'lucide-react';
import { PeriodCard } from './PeriodCard';

interface PeriodsSectionProps {
  data: ReportPeriodSummary[];
  users: { id: string; name: string }[];
}

export function PeriodsSection({ data, users }: PeriodsSectionProps) {
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

  return (
    <div className="space-y-4">
      <h3 className={reportsStyles.periods.sectionTitle}>
        <CalendarDays className="w-5 h-5" />
        Report Periods
      </h3>

      {data.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl border-primary/20 bg-primary/5">
          <p className="text-primary/60">No periods found for this range.</p>
        </div>
      ) : (
        <div className={`grid gap-6 grid-cols-${activeUsers.length}`}>
          {activeUsers.map((user) => (
            <React.Fragment key={user.id}>
              <div key={user.id} className="space-y-4">
                <h4 className="text-lg font-semibold flex items-center gap-2 border-b border-primary/20 pb-2 text-primary">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  {user.name}
                </h4>

                <div className="space-y-4">
                  {periodsByUser[user.id].map((period) => (
                    <PeriodCard key={period.id} period={period} />
                  ))}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
