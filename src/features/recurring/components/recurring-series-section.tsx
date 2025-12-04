"use client";

import { RecurringTransactionSeries } from "@/src/lib";
import { SeriesCard } from "@/src/components/cards";
import { EmptyState } from "@/components/shared";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

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
  className = "",
  showActions = false,
  onCreateRecurringSeries,
  onEditRecurringSeries,
}: RecurringSeriesSectionProps) {
  const isLoading = false;

  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-2 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-linear-to-r from-muted to-card rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (0 === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <EmptyState
          icon={RefreshCw}
          title="Nessuna serie ricorrente trovata"
          description="Le serie ricorrenti configurate appariranno qui"
          action={
            onCreateRecurringSeries && (
              <Button onClick={onCreateRecurringSeries} variant="outline" size="sm">
                Aggiungi Serie
              </Button>
            )
          }
        />
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Transazioni Ricorrenti</h3>
              <p className="text-xs">
                {0} {1 === 1 ? "serie attiva" : "serie attive"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Series List */}
      <div className="p-2 space-y-2">
        {[].map((series) => (
          <SeriesCard key={""} series={series} showActions={showActions} onEdit={onEditRecurringSeries} />
        ))}
      </div>
    </div>
  );
}

export default RecurringSeriesSection;
