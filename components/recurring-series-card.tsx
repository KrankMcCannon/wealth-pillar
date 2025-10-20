'use client';

import { Play, Pause, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IconContainer, Text, StatusBadge, Amount } from '@/components/ui/primitives';
import type { RecurringTransactionSeries } from '@/lib/types';
import { CategoryIcon, iconSizes } from '@/lib/icons';
import { useExecuteRecurringSeries, usePauseRecurringSeries, useResumeRecurringSeries } from '@/hooks';

interface RecurringSeriesCardProps {
  series: RecurringTransactionSeries;
  className?: string;
  showActions?: boolean;
  onEdit?: (series: RecurringTransactionSeries) => void;
}

export function RecurringSeriesCard({
  series,
  className = '',
  showActions = false,
  onEdit,
}: RecurringSeriesCardProps) {
  const executeSeriesMutation = useExecuteRecurringSeries();
  const pauseSeriesMutation = usePauseRecurringSeries();
  const resumeSeriesMutation = useResumeRecurringSeries();

  const nextDueDate = new Date(series.due_date);
  const now = new Date();
  const daysUntilDue = Math.ceil((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'Settimanale';
      case 'biweekly': return 'Quindicinale';
      case 'monthly': return 'Mensile';
      case 'yearly': return 'Annuale';
      default: return frequency;
    }
  };

  const getDueDateLabel = (days: number) => {
    if (days === 0) return 'Oggi';
    if (days === 1) return 'Domani';
    if (days < 0) return `${Math.abs(days)} giorni fa`;
    if (days <= 7) return `Tra ${days} giorni`;
    return nextDueDate.toLocaleDateString('it-IT');
  };

  const handleExecute = async () => {
    try {
      await executeSeriesMutation.mutateAsync(series.id);
    } catch (error) {
      console.error('Failed to execute series:', error);
    }
  };

  const handlePause = async () => {
    try {
      await pauseSeriesMutation.mutateAsync({ id: series.id });
    } catch (error) {
      console.error('Failed to pause series:', error);
    }
  };

  const handleResume = async () => {
    try {
      await resumeSeriesMutation.mutateAsync(series.id);
    } catch (error) {
      console.error('Failed to resume series:', error);
    }
  };

  const handleEdit = () => {
    onEdit?.(series);
  };

  const isOverdue = daysUntilDue < 0;
  const isDueToday = daysUntilDue === 0;
  const isDueSoon = daysUntilDue <= 3;

  const getCardStyles = () => {
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
    if (isOverdue) return 'expense';
    if (isDueToday || isDueSoon) return series.type === 'income' ? 'income' : 'expense';
    return series.type === 'income' ? 'income' : 'expense';
  };

  return (
    <div
      className={`${getCardStyles()} transition-all duration-300 group cursor-pointer flex items-center justify-between gap-3 ${className}`}
      onClick={handleEdit}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Icon */}
        <IconContainer size="md" color={getIconColor()} className="rounded-lg shrink-0">
          <CategoryIcon
            categoryKey={series.category}
            size={iconSizes.sm}
          />
        </IconContainer>

        {/* Content */}
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
          </div>
        </div>
      </div>

      {/* Amount and Actions */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <Amount
          type={getAmountType()}
          size="md"
          emphasis="strong"
        >
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExecute();
                    }}
                    disabled={executeSeriesMutation.isPending}
                  >
                    <Play className="h-3 w-3 text-accent" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                className="h-6 w-6 p-0 hover:bg-warning/10 rounded-md transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePause();
                  }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleResume();
                }}
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
  );
}

export default RecurringSeriesCard;
