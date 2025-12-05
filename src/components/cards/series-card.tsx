/**
 * SeriesCard - Domain card for recurring transaction series
 *
 * Refactored from SeriesCard
 * Note: Maintains business logic for series management (execute, pause, resume)
 * but uses DomainCard for layout structure where possible
 */

"use client";

import { useState, useMemo } from "react";
import { CategoryIcon, cn, iconSizes, RecurringTransactionSeries } from "@/src/lib";
import { RecurringService } from "@/src/lib/services";
import type { User } from "@/lib/types";
import {
  executeRecurringSeriesAction,
  toggleRecurringSeriesActiveAction,
} from "@/src/features/recurring/actions/recurring-actions";
import { Play, Pause } from "lucide-react";
import { Amount, Button, Card, IconContainer, StatusBadge, Text } from "@/src/components/ui";

interface SeriesCardProps {
  readonly series: RecurringTransactionSeries;
  readonly className?: string;
  readonly showActions?: boolean;
  /** Callback quando si clicca per modificare (modale) */
  readonly onEdit?: (series: RecurringTransactionSeries) => void;
  /** Callback quando si clicca sulla card (navigazione o altro) - se definito, sovrascrive onEdit per il click */
  readonly onCardClick?: (series: RecurringTransactionSeries) => void;
  readonly onSeriesUpdate?: (series: RecurringTransactionSeries) => void;
  /** Group users for displaying user badges */
  readonly groupUsers?: User[];
}

// Helper function: Get frequency label
function getFrequencyLabel(frequency: string): string {
  const labels: Record<string, string> = {
    weekly: "Settimanale",
    biweekly: "Quindicinale",
    monthly: "Mensile",
    yearly: "Annuale",
  };
  return labels[frequency] || frequency;
}

// Helper function: Get due date label
function getDueDateLabel(days: number): string {
  if (days === 0) return "Oggi";
  if (days === 1) return "Domani";
  if (days < 0) return `${Math.abs(days)} giorni fa`;
  if (days <= 7) return `Tra ${days} giorni`;
  return `Tra ${days} giorni`;
}

export function SeriesCard({ series, className, showActions = false, onEdit, onCardClick, onSeriesUpdate, groupUsers }: SeriesCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Calculate due date info using RecurringService
  const daysUntilDue = RecurringService.calculateDaysUntilDue(series);
  const isOverdue = daysUntilDue < 0;
  const isDueToday = daysUntilDue === 0;
  const isDueSoon = daysUntilDue <= 3;

  // Get associated users for badge display
  const associatedUsers = useMemo(() => {
    if (!groupUsers) return [];
    return RecurringService.getAssociatedUsers(series, groupUsers);
  }, [series, groupUsers]);

  // Handle card click - use onCardClick if defined, otherwise fall back to onEdit
  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(series);
    } else {
      onEdit?.(series);
    }
  };

  // Action handlers
  const handleExecute = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await executeRecurringSeriesAction(series.id);
      if (result.error) {
        console.error('Failed to execute series:', result.error);
      }
      // Trigger refresh of series list
      onSeriesUpdate?.(series);
    } catch (error) {
      console.error('Failed to execute series:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await toggleRecurringSeriesActiveAction(series.id, false);
      if (result.error) {
        console.error('Failed to pause series:', result.error);
      } else if (result.data) {
        onSeriesUpdate?.(result.data);
      }
    } catch (error) {
      console.error('Failed to pause series:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await toggleRecurringSeriesActiveAction(series.id, true);
      if (result.error) {
        console.error('Failed to resume series:', result.error);
      } else if (result.data) {
        onSeriesUpdate?.(result.data);
      }
    } catch (error) {
      console.error('Failed to resume series:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Styling logic (centralized)
  const getCardStyles = (): string => {
    const baseStyles = "p-3 bg-card rounded-xl";
    if (!series.is_active) {
      return `${baseStyles} border border-primary/20 opacity-60`;
    }
    if (isOverdue) {
      return `${baseStyles} border border-destructive/30 hover:border-destructive/40`;
    }
    if (isDueToday) {
      return `${baseStyles} border border-warning/40 hover:border-warning/50`;
    }
    if (isDueSoon) {
      return `${baseStyles} border border-warning/30 hover:border-warning/40`;
    }
    return `${baseStyles} border border-primary/20 hover:border-primary/30`;
  };

  const getIconColor = (): "primary" | "warning" | "destructive" | "muted" => {
    if (!series.is_active) return "muted";
    if (isOverdue) return "destructive";
    if (isDueToday || isDueSoon) return "warning";
    return "primary";
  };

  const getAmountType = (): "income" | "expense" | "neutral" => {
    if (!series.is_active) return "neutral";
    return series.type === "income" ? "income" : "expense";
  };

  return (
    <Card
      className={cn(getCardStyles(), "transition-all duration-300 group cursor-pointer", className)}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left Section: Icon + Content */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <IconContainer size="md" color={getIconColor()} className="rounded-lg shrink-0">
            <CategoryIcon categoryKey={series.category} size={iconSizes.sm} />
          </IconContainer>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Text
                variant="heading"
                size="sm"
                as="h3"
                className="group-hover:text-primary/80 transition-colors truncate"
              >
                {series.description}
              </Text>
              {!series.is_active && (
                <StatusBadge status="info" size="sm">
                  Pausata
                </StatusBadge>
              )}
            </div>
            <div className="space-y-0.5">
              <Text variant="muted" size="xs" className="font-medium">
                {getFrequencyLabel(series.frequency)}
              </Text>
              <Text variant="muted" size="xs">
                Prossima: {getDueDateLabel(daysUntilDue)}
              </Text>

              {/* User badges - show if multiple users */}
              {associatedUsers.length > 1 && (
                <div className="flex items-center gap-1 mt-1.5">
                  {associatedUsers.slice(0, 3).map((user) => (
                    <div
                      key={user.id}
                      className="w-5 h-5 rounded-full border border-white/20 dark:border-gray-700 flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: user.theme_color }}
                      title={user.name}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {associatedUsers.length > 3 && (
                    <span className="text-[10px] text-muted-foreground font-medium">
                      +{associatedUsers.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Amount + Actions */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Amount type={getAmountType()} size="md" emphasis="strong">
            {series.type === "income" ? series.amount : -series.amount}
          </Amount>

          {showActions && (
            <div className="flex items-center gap-0.5">
              {series.is_active ? (
                <>
                  {(isDueToday || isOverdue) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-primary/8 rounded-md transition-all duration-200"
                      onClick={handleExecute}
                      disabled={isLoading}
                    >
                      <Play className="h-3 w-3 text-accent" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-warning/10 rounded-md transition-all duration-200"
                    onClick={handlePause}
                    disabled={isLoading}
                  >
                    <Pause className="h-3 w-3 text-warning" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-primary/5 rounded-md transition-all duration-200"
                  onClick={handleResume}
                  disabled={isLoading}
                >
                  <Play className="h-3 w-3 text-primary" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default SeriesCard;
