/**
 * SeriesCard - Domain card for recurring transaction series
 *
 * Refactored from SeriesCard
 * Note: Maintains business logic for series management (execute, pause, resume)
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn, RecurringTransactionSeries } from "@/lib";
import { CategoryService, RecurringService } from "@/lib/services";
import type { User } from "@/lib/types";
import {
  executeRecurringSeriesAction,
  toggleRecurringSeriesActiveAction,
} from "@/features/recurring/actions/recurring-actions";
import { Play } from "lucide-react";
import { Amount, Button, Card, CategoryBadge, StatusBadge, Text } from "@/components/ui";
import { cardStyles, getSeriesCardClassName, getSeriesUserBadgeStyle } from "./theme/card-styles";
import { useCategories } from "@/stores/reference-data-store";
import { motion, useMotionValue, type PanInfo, animate } from "framer-motion";
import {
  rowCardStyles,
  rowCardTokens,
  getRowCardMotionStyle,
} from "@/components/ui/layout/theme/row-card-styles";

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
  const [swipeSide, setSwipeSide] = useState<"left" | "right" | null>(null);
  const hasDragged = useRef(false);
  const x = useMotionValue(0);
  const categories = useCategories();
  const categoryColor = useMemo(() => {
    return CategoryService.getCategoryColor(categories, series.category);
  }, [categories, series.category]);
  const canSwipeDelete = Boolean(onDelete) && showDelete;
  const canSwipePause = showActions;
  const { swipe, spring, drag, tap } = rowCardTokens.interaction;

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

  const executeSeries = async () => {
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

  const pauseSeries = async () => {
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

  const resumeSeries = async () => {
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
  // Action handlers
  const handleExecute = (e: React.MouseEvent) => {
    e.stopPropagation();
    void executeSeries();
  };

  const handleSwipeDelete = () => {
    onDelete?.(series);
  };

  const handleSwipePause = () => {
    if (series.is_active) {
      void pauseSeries();
      return;
    }
    void resumeSeries();
  };

  useEffect(() => {
    if (!canSwipeDelete && !canSwipePause) return;

    const targetX = swipeSide === "left"
      ? swipe.actionWidth
      : swipeSide === "right"
        ? -swipe.actionWidth
        : 0;
    if (x.get() !== targetX) {
      animate(x, targetX, {
        type: "spring",
        stiffness: spring.stiffness,
        damping: spring.damping,
      });
    }
  }, [swipeSide, canSwipeDelete, canSwipePause, x, swipe.actionWidth, spring.stiffness, spring.damping]);

  const handleDragStart = () => {
    hasDragged.current = false;
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!canSwipeDelete && !canSwipePause) return;

    const currentX = x.get();
    const velocityX = info.velocity.x;
    const dragDistance = Math.abs(info.offset.x);

    if (dragDistance > 10) {
      hasDragged.current = true;
    }

    if (swipeSide === "right") {
      const shouldClose = currentX > -swipe.actionWidth * 0.7 || velocityX > 10;
      setSwipeSide(shouldClose ? null : "right");
    } else if (swipeSide === "left") {
      const shouldClose = currentX < swipe.actionWidth * 0.7 || velocityX < -10;
      setSwipeSide(shouldClose ? null : "left");
    } else {
      if (canSwipeDelete && (currentX < -swipe.threshold || velocityX < swipe.velocityThreshold)) {
        setSwipeSide("right");
      } else if (canSwipePause && (currentX > swipe.threshold || velocityX > Math.abs(swipe.velocityThreshold))) {
        setSwipeSide("left");
      } else {
        setSwipeSide(null);
      }
    }

    setTimeout(() => {
      hasDragged.current = false;
    }, 100);
  };

  const handleTap = () => {
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }

    const currentX = x.get();
    if (swipeSide || Math.abs(currentX) > tap.threshold) {
      setSwipeSide(null);
      if (handleCardClick) {
        setTimeout(() => {
          handleCardClick();
        }, 200);
      }
      return;
    }

    handleCardClick();
  };

  const getSwipeLayerStyle = (isOpen: boolean, side: "left" | "right") => {
    const width = isOpen ? `${swipe.actionWidth}px` : "0px";
    const transform = isOpen ? "translateX(0)" : side === "left" ? "translateX(-12px)" : "translateX(12px)";
    return {
      width,
      opacity: isOpen ? 1 : 0,
      transform,
      transition: "width 0.25s ease, opacity 0.2s ease, transform 0.25s ease",
    };
  };

  const getAmountType = (): "income" | "expense" | "neutral" => {
    if (!series.is_active) return "neutral";
    return series.type === "income" ? "income" : "expense";
  };

  const cardContent = (
    <Card
      className={cn(
        getSeriesCardClassName({ isActive: series.is_active, isOverdue, isDueToday, isDueSoon }),
        className
      )}
      onClick={canSwipeDelete || canSwipePause ? undefined : handleCardClick}
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
          <Text variant="body" size="xs" className={cardStyles.series.dueDate}>
            Prossima: {getDueDateLabel(daysUntilDue)}
          </Text>

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
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  if (canSwipeDelete || canSwipePause) {
    return (
      <div className={rowCardStyles.wrapper}>
        {canSwipePause && (
          <div
            className="absolute inset-y-0 left-0 z-0 flex items-center justify-start"
            style={getSwipeLayerStyle(swipeSide === "left", "left")}
            onClick={(e) => {
              e.stopPropagation();
              if (swipeSide === "left") {
                setSwipeSide(null);
              }
            }}
          >
            <div
              className={`px-6 h-full font-medium flex items-center justify-center transition-all duration-200 ease-out ${
                series.is_active
                  ? "bg-warning text-white"
                  : "bg-primary text-primary-foreground"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleSwipePause();
              }}
            >
              {series.is_active ? "Pausa" : "Riprendi"}
            </div>
          </div>
        )}
        {canSwipeDelete && (
          <div
            className={rowCardStyles.swipe.deleteLayer}
            style={getSwipeLayerStyle(swipeSide === "right", "right")}
            onClick={(e) => {
              e.stopPropagation();
              if (swipeSide === "right") {
                setSwipeSide(null);
              }
            }}
          >
            <div
              className={rowCardStyles.swipe.deleteButton}
              onClick={(e) => {
                e.stopPropagation();
                handleSwipeDelete();
              }}
            >
              Elimina
            </div>
          </div>
        )}

        <motion.div
          drag="x"
          dragConstraints={{
            left: canSwipeDelete ? -swipe.actionWidth : 0,
            right: canSwipePause ? swipe.actionWidth : 0,
          }}
          dragElastic={drag.elastic}
          dragMomentum={false}
          style={getRowCardMotionStyle(x)}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onTap={handleTap}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10"
        >
          {cardContent}
        </motion.div>
      </div>
    );
  }

  return cardContent;
}

export default SeriesCard;
