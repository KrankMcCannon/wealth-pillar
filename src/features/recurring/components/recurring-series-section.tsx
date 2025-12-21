"use client";

/**
 * RecurringSeriesSection - Display recurring transaction series
 *
 * Shows a list of recurring series with filtering and actions.
 * Data is passed from parent component (Server Component pattern).
 */

import { useMemo } from "react";
import { RecurringTransactionSeries } from "@/src/lib";
import { SeriesCard } from "@/src/components/cards";
import { EmptyState } from "@/components/shared";
import { RefreshCw, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui";
import { RecurringService } from "@/lib/services";
import { formatCurrency } from "@/lib/utils";

interface RecurringSeriesSectionProps {
  /** All recurring series data */
  readonly series: RecurringTransactionSeries[];
  /** Filter series by user ID (optional) */
  readonly selectedUserId?: string;
  /** Additional CSS classes */
  readonly className?: string;
  /** Maximum number of items to display */
  readonly maxItems?: number;
  /** Show action buttons on each series card */
  readonly showActions?: boolean;
  /** Show statistics header */
  readonly showStats?: boolean;
  /** Show delete icon on each series card */
  readonly showDelete?: boolean;
  /** Callback when create button is clicked */
  readonly onCreateRecurringSeries?: () => void;
  /** Callback when edit button is clicked (modale) */
  readonly onEditRecurringSeries?: (series: RecurringTransactionSeries) => void;
  /** Callback when card is clicked (navigazione) - se definito, sovrascrive onEditRecurringSeries per il click */
  readonly onCardClick?: (series: RecurringTransactionSeries) => void;
  /** Callback when delete icon is clicked */
  readonly onDeleteRecurringSeries?: (series: RecurringTransactionSeries) => void;
}

export function RecurringSeriesSection({
  series,
  selectedUserId,
  className = "",
  maxItems,
  showActions = false,
  showStats = false,
  showDelete = false,
  onCreateRecurringSeries,
  onEditRecurringSeries,
  onCardClick,
  onDeleteRecurringSeries,
}: RecurringSeriesSectionProps) {
  // Filter series by user if selected
  const filteredSeries = useMemo(() => {
    let result = series;

    // Filter by user (check if user is in user_ids array)
    if (selectedUserId) {
      result = result.filter((s) => s.user_ids.includes(selectedUserId));
    }

    // Sort by days left (ascending)
    result = result
      .slice()
      .sort((a, b) => RecurringService.calculateDaysUntilDue(a) - RecurringService.calculateDaysUntilDue(b));

    // Limit results if maxItems specified
    if (maxItems && maxItems > 0) {
      result = result.slice(0, maxItems);
    }

    return result;
  }, [series, selectedUserId, maxItems]);

  // Get active series only for count
  const activeSeries = useMemo(() => {
    return filteredSeries.filter((s) => s.is_active);
  }, [filteredSeries]);

  // Calculate monthly totals using service method
  const monthlyTotals = useMemo(() => {
    return RecurringService.calculateTotals(activeSeries);
  }, [activeSeries]);

  // Empty state
  if (filteredSeries.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <EmptyState
          icon={RefreshCw}
          title="Nessuna serie ricorrente"
          description={
            selectedUserId
              ? "Non ci sono serie ricorrenti per questo utente"
              : "Le serie ricorrenti configurate appariranno qui"
          }
          action={
            onCreateRecurringSeries && (
              <Button onClick={onCreateRecurringSeries} variant="default" size="sm">
                <Plus className="h-4 w-4 mr-2" />
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
      {/* Header Section */}
      <div className="px-4 pt-4 pb-3 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
              <RefreshCw className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Transazioni Ricorrenti</h3>
              <p className="text-xs text-muted-foreground">
                {activeSeries.length} {activeSeries.length === 1 ? "serie attiva" : "serie attive"}
                {filteredSeries.length > activeSeries.length && (
                  <span className="text-muted-foreground/70">
                    {" "}
                    • {filteredSeries.length - activeSeries.length} in pausa
                  </span>
                )}
              </p>
            </div>
          </div>

          {onCreateRecurringSeries && (
            <Button variant="ghost" size="sm" onClick={onCreateRecurringSeries} className="h-8 px-2">
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Stats Section */}
        {showStats && activeSeries.length > 0 && (
          <div className="mt-3 pt-3 border-t border-primary/10 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Entrate/mese</p>
                <p className="text-sm font-semibold text-emerald-500">+{formatCurrency(monthlyTotals.totalIncome)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-lg bg-red-500/10">
                <TrendingDown className="w-3 h-3 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Uscite/mese</p>
                <p className="text-sm font-semibold text-red-500">-{formatCurrency(monthlyTotals.totalExpenses)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Series List */}
      <div className="p-2 space-y-2">
        {filteredSeries.map((item) => (
          <SeriesCard
            key={item.id}
            series={item}
            showActions={showActions}
            showDelete={showDelete}
            onEdit={onEditRecurringSeries}
            onCardClick={onCardClick}
            onDelete={onDeleteRecurringSeries}
          />
        ))}
      </div>

      {/* Show More Link (if truncated) */}
      {maxItems && series.length > maxItems && (
        <div className="px-4 pb-3 pt-1">
          <p className="text-xs text-muted-foreground text-center">
            Mostrando {filteredSeries.length} di{" "}
            {selectedUserId ? series.filter((s) => s.user_ids.includes(selectedUserId)).length : series.length} serie
          </p>
        </div>
      )}
    </div>
  );
}

export default RecurringSeriesSection;
