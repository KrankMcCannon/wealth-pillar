'use client';

import { RecurringTransactionSeries } from "@/lib";
import { useRecurringSeries, useRecurringSeriesByUser } from "../hooks/use-recurring-series";
import SeriesCard from "./series-card";

interface RecurringSeriesSectionProps {
  selectedUserId?: string;
  className?: string;
  maxItems?: number;
  showActions?: boolean;
  showStats?: boolean;
  onCreateRecurringSeries?: () => void;
  onEditRecurringSeries?: (series: RecurringTransactionSeries) => void;
}

export function RecurringSeriesSection({
  selectedUserId = 'all',
  className = '',
  maxItems = 5,
  showActions = false,
  onCreateRecurringSeries,
  onEditRecurringSeries,
}: RecurringSeriesSectionProps) {
  // Get data using new hooks
  const isAllUsers = selectedUserId === 'all';
  const allSeriesAllQuery = useRecurringSeries();
  const allSeriesByUserQuery = useRecurringSeriesByUser(!isAllUsers ? selectedUserId : '');
  const chosenAllSeriesQuery = isAllUsers ? allSeriesAllQuery : allSeriesByUserQuery;
  const allSeries: RecurringTransactionSeries[] = chosenAllSeriesQuery.data || [];

  // Sort by due date
  const sortByDueDateAsc = (a: RecurringTransactionSeries, b: RecurringTransactionSeries) =>
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime();

  const activeSorted = allSeries.filter(s => s.is_active).slice().sort(sortByDueDateAsc);
  const inactiveSorted = allSeries.filter(s => !s.is_active).slice().sort(sortByDueDateAsc);
  const displayedSeries = [...activeSorted, ...inactiveSorted];
  const limitedSeries = displayedSeries.slice(0, maxItems);

  const isLoading = chosenAllSeriesQuery.isLoading;

  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-2 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gradient-to-r from-muted to-card rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (displayedSeries.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-8 text-primary/70">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="font-medium text-primary">Nessuna serie ricorrente trovata</p>
          <p className="text-sm mt-1">
            Le serie ricorrenti configurate appariranno qui
          </p>
          {onCreateRecurringSeries && (
            <button
              className="mt-4 px-4 py-2 bg-card border border-primary/20 text-primary hover:bg-primary/5 transition-all duration-200 rounded-xl shadow-sm text-sm font-medium"
              onClick={onCreateRecurringSeries}
            >
              <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Aggiungi Serie
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl ${className}`}>
      {/* Title Section */}
      <div className="px-4 pt-4 pb-3 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Transazioni Ricorrenti</h3>
              <p className="text-xs">{displayedSeries.length} {displayedSeries.length === 1 ? 'serie attiva' : 'serie attive'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Series List */}
      <div className="p-2 space-y-2">
        {limitedSeries.map((series) => (
          <SeriesCard
            key={series.id}
            series={series}
            showActions={showActions}
            onEdit={onEditRecurringSeries}
          />
        ))}
      </div>
    </div>
  );
}

export default RecurringSeriesSection;
