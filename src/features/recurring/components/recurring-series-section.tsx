"use client";

/**
 * RecurringSeriesSection - Display recurring transaction series
 *
 * Shows a list of recurring series with filtering and actions.
 * Data is passed from parent component (Server Component pattern).
 */

import { useMemo } from "react";
import { RecurringTransactionSeries } from "@/lib";
import { SeriesCard } from "@/components/cards";
import { EmptyState } from "@/components/shared";
import { RefreshCw, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui";
import { RecurringService } from "@/lib/services";
import { formatCurrency, cn } from "@/lib/utils";
import { User } from "@/lib/types";
import { recurringStyles } from "../theme/recurring-styles";

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
  /** Group users for badge display on cards */
  readonly groupUsers?: User[];
  /** Callback when series is updated (pause/resume) to refresh UI */
  readonly onSeriesUpdate?: (series: RecurringTransactionSeries) => void;
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
  groupUsers,
  onSeriesUpdate,
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
      <div className={cn(recurringStyles.section.emptyWrap, className)}>
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
                <Plus className={recurringStyles.section.emptyActionIcon} />
                Aggiungi Serie
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className={cn(recurringStyles.section.container, className)}>
      {/* Header Section */}
      <div className={recurringStyles.section.header}>
        <div className={recurringStyles.section.headerRow}>
          <div className={recurringStyles.section.headerLeft}>
            <div className={recurringStyles.section.headerIconWrap}>
              <RefreshCw className={recurringStyles.section.headerIcon} />
            </div>
            <div>
              <h3 className={recurringStyles.section.title}>Transazioni Ricorrenti</h3>
              <p className={recurringStyles.section.subtitle}>
                {selectedUserId ? series.filter((s) => s.user_ids.includes(selectedUserId)).length : series.length} {activeSeries.length === 1 ? "serie attiva" : "serie attive"}
                {filteredSeries.length > activeSeries.length && (
                  <span className={recurringStyles.section.subtitleMuted}>
                    {" "}
                    • {filteredSeries.length - activeSeries.length} in pausa
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        {showStats && activeSeries.length > 0 && (
          <div className={recurringStyles.section.stats}>
            <div className={recurringStyles.section.statRow}>
              <div className={recurringStyles.section.statLeft}>
                <div className={recurringStyles.section.statIconWrapPositive}>
                  <TrendingUp className={recurringStyles.section.statIconPositive} />
                </div>
                <p className={recurringStyles.section.statLabel}>Entrate/mese</p>
              </div>
              <p className={recurringStyles.section.statValuePositive}>
                +{formatCurrency(monthlyTotals.totalIncome)}
              </p>
            </div>
            <div className={recurringStyles.section.statRow}>
              <div className={recurringStyles.section.statLeft}>
                <div className={recurringStyles.section.statIconWrapNegative}>
                  <TrendingDown className={recurringStyles.section.statIconNegative} />
                </div>
                <p className={recurringStyles.section.statLabel}>Uscite/mese</p>
              </div>
              <p className={recurringStyles.section.statValueNegative}>
                -{formatCurrency(monthlyTotals.totalExpenses)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Series List */}
      <div className={recurringStyles.section.list}>
        {filteredSeries.map((item) => (
          <SeriesCard
            key={item.id}
            series={item}
            showActions={showActions}
            showDelete={showDelete}
            onEdit={onEditRecurringSeries}
            onCardClick={onCardClick}
            onDelete={onDeleteRecurringSeries}
            groupUsers={groupUsers}
            onSeriesUpdate={onSeriesUpdate}
          />
        ))}
      </div>

      {/* Show More Link (if truncated) */}
      {maxItems && series.length > maxItems && (
        <div className={recurringStyles.section.footer}>
          <p className={recurringStyles.section.footerText}>
            Mostrando {filteredSeries.length} di{" "}
            {selectedUserId ? series.filter((s) => s.user_ids.includes(selectedUserId)).length : series.length} serie
          </p>
        </div>
      )}
    </div>
  );
}

export default RecurringSeriesSection;
