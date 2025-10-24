/**
 * SeriesCard - Domain card for recurring transaction series
 *
 * Refactored from SeriesCard
 * Note: Maintains business logic for series management (execute, pause, resume)
 * but uses DomainCard for layout structure where possible
 */

'use client';

import { CategoryIcon, cn, iconSizes, RecurringTransactionSeries } from '@/src/lib';
import { Play, Pause, Settings } from 'lucide-react';
import { useExecuteRecurringSeries, usePauseRecurringSeries, useResumeRecurringSeries } from '@/src/features/recurring/hooks/use-recurring-series';
import { Amount, Button, Card, IconContainer, StatusBadge, Text } from '@/src/components/ui';

interface SeriesCardProps {
  series: RecurringTransactionSeries;
  className?: string;
  showActions?: boolean;
  onEdit?: (series: RecurringTransactionSeries) => void;
}

// Helper function: Get frequency label
function getFrequencyLabel(frequency: string): string {
  const labels: Record<string, string> = {
    weekly: 'Settimanale',
    biweekly: 'Quindicinale',
    monthly: 'Mensile',
    yearly: 'Annuale',
  };
  return labels[frequency] || frequency;
}

// Helper function: Get due date label
function getDueDateLabel(days: number, date: Date): string {
  if (days === 0) return 'Oggi';
  if (days === 1) return 'Domani';
  if (days < 0) return `${Math.abs(days)} giorni fa`;
  if (days <= 7) return `Tra ${days} giorni`;
  return date.toLocaleDateString('it-IT');
}

// Helper function: Calculate days until due
function calculateDaysUntilDue(dueDate: Date): number {
  const now = new Date();
  return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function SeriesCard({
  series,
  className,
  showActions = false,
  onEdit,
}: SeriesCardProps) {
  // Mutations
  const executeSeriesMutation = useExecuteRecurringSeries();
  const pauseSeriesMutation = usePauseRecurringSeries();
  const resumeSeriesMutation = useResumeRecurringSeries();

  // Calculate due date info
  const nextDueDate = new Date(series.due_date);
  const daysUntilDue = calculateDaysUntilDue(nextDueDate);
  const isOverdue = daysUntilDue < 0;
  const isDueToday = daysUntilDue === 0;
  const isDueSoon = daysUntilDue <= 3;

  // Action handlers
  const handleExecute = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await executeSeriesMutation.mutateAsync(series.id);
    } catch (error) {
      console.error('Failed to execute series:', error);
    }
  };

  const handlePause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await pauseSeriesMutation.mutateAsync({ id: series.id });
    } catch (error) {
      console.error('Failed to pause series:', error);
    }
  };

  const handleResume = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await resumeSeriesMutation.mutateAsync(series.id);
    } catch (error) {
      console.error('Failed to resume series:', error);
    }
  };

  const handleEdit = () => {
    onEdit?.(series);
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
    if (!series.is_active) return 'muted';
    if (isOverdue) return 'destructive';
    if (isDueToday || isDueSoon) return 'warning';
    return 'primary';
  };

  const getAmountType = (): "income" | "expense" | "neutral" => {
    if (!series.is_active) return 'neutral';
    return series.type === 'income' ? 'income' : 'expense';
  };

  return (
    <Card
      className={cn(
        getCardStyles(),
        "transition-all duration-300 group cursor-pointer",
        className
      )}
      onClick={handleEdit}
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
                Prossima: {getDueDateLabel(daysUntilDue, nextDueDate)}
              </Text>
            </div>
          </div>
        </div>

        {/* Right Section: Amount + Actions */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Amount type={getAmountType()} size="md" emphasis="strong">
            {series.type === 'income' ? series.amount : -series.amount}
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
                      disabled={executeSeriesMutation.isPending}
                    >
                      <Play className="h-3 w-3 text-accent" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-warning/10 rounded-md transition-all duration-200"
                    onClick={handlePause}
                    disabled={pauseSeriesMutation.isPending}
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
                  disabled={resumeSeriesMutation.isPending}
                >
                  <Play className="h-3 w-3 text-primary" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-accent rounded-md transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
              >
                <Settings className="h-3 w-3 text-primary/70" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default SeriesCard;
