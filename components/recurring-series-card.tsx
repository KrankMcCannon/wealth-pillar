'use client';

import { Play, Pause, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
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
    // Final styles without spacing issues
    const baseStyles = "p-3 bg-white rounded-xl";
    if (!series.is_active) {
      return `${baseStyles} border border-slate-200/60 opacity-60`;
    }
    if (isOverdue) {
      return `${baseStyles} border border-red-200/70 hover:border-red-300/80`;
    }
    if (isDueToday) {
      return `${baseStyles} border border-orange-200/70 hover:border-orange-300/80`;
    }
    if (isDueSoon) {
      return `${baseStyles} border border-amber-200/70 hover:border-amber-300/80`;
    }
    return `${baseStyles} border border-slate-200/60 hover:border-slate-300/60`;
  };

  const getAmountColor = () => {
    if (!series.is_active) return 'text-gray-500';
    if (isOverdue) return 'text-red-600';
    if (isDueToday) return 'text-orange-600';
    if (isDueSoon) return 'text-amber-600';
    return 'text-blue-600';
  };

  const getAmountValue = () => {
    return formatCurrency(series.type === 'income' ? series.amount : -series.amount);
  };

  return (
    <div
      className={`${getCardStyles()} transition-all duration-300 group cursor-pointer flex items-center justify-between gap-3 ${className}`}
      onClick={handleEdit}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Icon */}
        <div className={`flex size-10 items-center justify-center rounded-lg shrink-0 ${
          !series.is_active ? 'bg-slate-100' :
          isOverdue ? 'bg-red-50 border border-red-100' :
          isDueToday ? 'bg-orange-50 border border-orange-100' :
          isDueSoon ? 'bg-amber-50 border border-amber-100' :
          'bg-blue-50 border border-blue-100'
        }`}>
          <CategoryIcon
            categoryKey={series.category}
            size={iconSizes.sm}
            className={
              !series.is_active ? 'text-slate-400' :
              isOverdue ? 'text-red-600' :
              isDueToday ? 'text-orange-600' :
              isDueSoon ? 'text-amber-600' : 'text-blue-600'
            }
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-slate-900 group-hover:text-slate-800 transition-colors truncate text-sm">
              {series.description}
            </h3>
            {!series.is_active && (
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-300">
                Pausata
              </Badge>
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-xs text-slate-600 font-medium">
              {getFrequencyLabel(series.frequency)}
            </div>
            <div className="text-xs text-slate-500">
              Prossima: {getDueDateLabel(daysUntilDue)}
            </div>
          </div>
        </div>
      </div>

      {/* Amount and Actions */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <div className={`font-bold text-base ${getAmountColor()}`}>
          {getAmountValue()}
        </div>
        {showActions && (
          <div className="flex items-center gap-0.5">
            {series.is_active ? (
              <>
                {(isDueToday || isOverdue) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-emerald-50 rounded-md transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExecute();
                    }}
                    disabled={executeSeriesMutation.isPending}
                  >
                    <Play className="h-3 w-3 text-emerald-600" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-amber-50 rounded-md transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePause();
                  }}
                  disabled={pauseSeriesMutation.isPending}
                >
                  <Pause className="h-3 w-3 text-amber-600" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-blue-50 rounded-md transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResume();
                }}
                disabled={resumeSeriesMutation.isPending}
              >
                <Play className="h-3 w-3 text-blue-600" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-slate-50 rounded-md transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
            >
              <Settings className="h-3 w-3 text-slate-600" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecurringSeriesCard;
