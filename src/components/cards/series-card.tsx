/**
 * SeriesCard - Domain card for recurring transaction series
 *
 * Refactored from SeriesCard
 * Note: Maintains business logic for series management (execute, pause, resume)
 */

"use client";

import { useState, useMemo } from "react";
import { cn, RecurringTransactionSeries } from "@/lib";
import { CategoryService, RecurringService } from "@/lib/services";
import type { User } from "@/lib/types";
import {
  executeRecurringSeriesAction,
  toggleRecurringSeriesActiveAction,
} from "@/features/recurring/actions/recurring-actions";
import { Play, Pause, Trash2 } from "lucide-react";
import { Amount, Button, Card, CategoryBadge, StatusBadge, Text } from "@/components/ui";
import { cardStyles, getSeriesCardClassName, getSeriesUserBadgeStyle } from "./theme/card-styles";
import { useCategories } from "@/stores/reference-data-store";

interface SeriesCardProps {
  readonly series: RecurringTransactionSeries;
  readonly className?: string;
  readonly showActions?: boolean;
  readonly showDelete?: boolean;
  /** Callback quando si clicca per modificare (modale) */
  readonly onEdit?: (series: RecurringTransactionSeries) => void;
  /** Callback quando si clicca sulla card (navigazione o altro) - se definito, sovrascrive onEdit per il click */
  readonly onCardClick?: (series: RecurringTransactionSeries) => void;
  readonly onDelete?: (series: RecurringTransactionSeries) => void;
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

export function SeriesCard({
  series,
  className,
  showActions = false,
  showDelete = false,
  onEdit,
  onCardClick,
  onDelete,
  onSeriesUpdate,
  groupUsers,
}: SeriesCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const categories = useCategories();
  const categoryColor = useMemo(() => {
    return CategoryService.getCategoryColor(categories, series.category);
  }, [categories, series.category]);

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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(series);
  };

  const getAmountType = (): "income" | "expense" | "neutral" => {
    if (!series.is_active) return "neutral";
    return series.type === "income" ? "income" : "expense";
  };

  return (
    <Card
      className={cn(
        getSeriesCardClassName({ isActive: series.is_active, isOverdue, isDueToday, isDueSoon }),
        className
      )}
      onClick={handleCardClick}
    >
      <div className={cardStyles.series.layout}>
        {/* Left Section: Icon + Content */}
        <div className={cardStyles.series.left}>
          <CategoryBadge
            categoryKey={series.category}
            color={categoryColor}
            size="md"
            className={cardStyles.series.icon}
          />

          <div className={cardStyles.series.content}>
            <div className={cardStyles.series.titleRow}>
              <Text
                variant="primary"
                size="sm"
                as="h3"
                className={cardStyles.series.title}
              >
                {series.description}
              </Text>
              {!series.is_active && (
                <StatusBadge status="info" size="sm">
                  Stop
                </StatusBadge>
              )}
            </div>
            <div className={cardStyles.series.details}>
              <Text variant="body" size="xs" className={cardStyles.series.frequency}>
                {getFrequencyLabel(series.frequency)}
              </Text>
              <Text variant="body" size="xs">
                Prossima: {getDueDateLabel(daysUntilDue)}
              </Text>

              {/* User badges - show if multiple users */}
              {associatedUsers.length > 1 && (
                <div className={cardStyles.series.userBadges}>
                  {associatedUsers.slice(0, 3).map((user) => (
                    <div
                      key={user.id}
                      className={cardStyles.series.userBadge}
                      style={getSeriesUserBadgeStyle(user.theme_color)}
                      title={user.name}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {associatedUsers.length > 3 && (
                    <span className={cardStyles.series.userBadgeOverflow}>
                      +{associatedUsers.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Amount + Actions */}
        <div className={cardStyles.series.right}>
          <Amount type={getAmountType()} size="md" emphasis="strong">
            {series.type === "income" ? series.amount : -series.amount}
          </Amount>

          {showActions && (
            <div className={cardStyles.series.actions}>
              {series.is_active ? (
                <>
                  {(isDueToday || isOverdue) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`${cardStyles.series.actionButton} ${cardStyles.series.actionPrimary}`}
                      onClick={handleExecute}
                      disabled={isLoading}
                    >
                      <Play className={`${cardStyles.series.actionIcon} ${cardStyles.series.actionIconAccent}`} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`${cardStyles.series.actionButton} ${cardStyles.series.actionWarning}`}
                    onClick={handlePause}
                    disabled={isLoading}
                  >
                    <Pause className={`${cardStyles.series.actionIcon} ${cardStyles.series.actionIconWarning}`} />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${cardStyles.series.actionButton} ${cardStyles.series.actionNeutral}`}
                  onClick={handleResume}
                  disabled={isLoading}
                >
                  <Play className={`${cardStyles.series.actionIcon} ${cardStyles.series.actionIconPrimary}`} />
                </Button>
              )}
              {showDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${cardStyles.series.actionButton} ${cardStyles.series.actionDestructive}`}
                  onClick={handleDelete}
                >
                  <Trash2 className={`${cardStyles.series.actionIcon} ${cardStyles.series.actionIconDestructive}`} />
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
