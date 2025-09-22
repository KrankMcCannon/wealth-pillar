'use client';

import { Calendar, Clock, TrendingUp, TrendingDown, Repeat, Play, Pause, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { RecurringTransactionSeries } from '@/lib/types';
import { CategoryIcon, iconSizes } from '@/lib/icons';
import { useExecuteRecurringSeries, usePauseRecurringSeries, useResumeRecurringSeries } from '@/hooks';

interface RecurringSeriesCardNewProps {
  series: RecurringTransactionSeries;
  className?: string;
  showDetails?: boolean;
  showActions?: boolean;
}

export function RecurringSeriesCardNew({
  series,
  className = '',
  showDetails = true,
  showActions = false
}: RecurringSeriesCardNewProps) {
  const executeSeriesMutation = useExecuteRecurringSeries();
  const pauseSeriesMutation = usePauseRecurringSeries();
  const resumeSeriesMutation = useResumeRecurringSeries();

  const nextDueDate = new Date(series.next_due_date);
  const now = new Date();
  const daysUntilDue = Math.ceil((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const getUrgencyColor = (days: number) => {
    if (days === 0) return 'bg-red-100 text-red-800 border-red-200';
    if (days === 1) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (days <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (days <= 7) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getDaysLabel = (days: number) => {
    if (days === 0) return 'Oggi';
    if (days === 1) return 'Domani';
    if (days < 0) return `${Math.abs(days)} giorni fa`;
    return `Tra ${days} giorni`;
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'weekly':
      case 'biweekly':
      case 'monthly':
      case 'yearly':
        return <Calendar className="w-3 h-3" />;
      default:
        return <Repeat className="w-3 h-3" />;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'Settimanale';
      case 'biweekly': return 'Quindicinale';
      case 'monthly': return 'Mensile';
      case 'yearly': return 'Annuale';
      default: return frequency;
    }
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

  const isOverdue = daysUntilDue < 0;
  const isDueToday = daysUntilDue === 0;

  return (
    <div className={`px-3 py-3 hover:bg-gradient-to-r hover:from-[#7578EC]/5 hover:to-[#7578EC]/2 transition-all duration-200 cursor-pointer rounded-xl border border-slate-200/50 ${className} ${series.is_paused ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        {/* Left side - Icon and Series Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <div className={`flex size-11 items-center justify-center rounded-2xl shadow-lg ${
              series.is_paused ? 'bg-gradient-to-br from-gray-100 to-gray-50' :
              isOverdue ? 'bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-200/50' :
              isDueToday ? 'bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-200/50' :
              'bg-gradient-to-br from-[#7578EC]/10 to-[#7578EC]/5'
            }`}>
              <CategoryIcon
                categoryKey={series.category}
                size={iconSizes.md}
                className={
                  series.is_paused ? 'text-gray-400' :
                  isOverdue ? 'text-red-600' :
                  isDueToday ? 'text-orange-600' : 'text-[#7578EC]'
                }
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-medium truncate ${series.is_paused ? 'text-gray-500' : 'text-gray-900'}`}>
                {series.name}
              </h3>
              {series.is_paused && (
                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-300">
                  In Pausa
                </Badge>
              )}
              {series.auto_execute && (
                <Badge variant="outline" className="text-xs bg-[#7578EC]/10 text-[#7578EC] border-[#7578EC]/30">
                  Auto
                </Badge>
              )}
            </div>

            <p className={`text-sm mb-2 ${series.is_paused ? 'text-gray-400' : 'text-gray-600'}`}>
              {series.description}
            </p>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              {getFrequencyIcon(series.frequency)}
              <span>{getFrequencyLabel(series.frequency)}</span>
              <span className="text-gray-400">•</span>
              <span>{series.total_executions} esecuzioni</span>
              {series.failed_executions > 0 && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-red-600">{series.failed_executions} fallite</span>
                </>
              )}
            </div>

            {showDetails && (
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {series.last_executed_date && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Ultima: {new Date(series.last_executed_date).toLocaleDateString('it-IT')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Prossima: {nextDueDate.toLocaleDateString('it-IT')}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Amount and Actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1">
            {series.type === 'income' ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={`font-semibold ${
              series.type === 'income' ? 'text-green-600' : 'text-gray-900'
            }`}>
              {formatCurrency(series.amount)}
            </span>
          </div>

          <Badge
            className={`text-xs font-medium border ${getUrgencyColor(daysUntilDue)}`}
            variant="outline"
          >
            {getDaysLabel(daysUntilDue)}
          </Badge>

          {showActions && (
            <div className="flex items-center gap-1 mt-1">
              {!series.is_paused ? (
                <>
                  {(isDueToday || isOverdue) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-emerald-500/10 rounded-lg transition-all duration-200"
                      onClick={handleExecute}
                      disabled={executeSeriesMutation.isPending}
                    >
                      <Play className="h-3 w-3 text-emerald-600" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-amber-500/10 rounded-lg transition-all duration-200"
                    onClick={handlePause}
                    disabled={pauseSeriesMutation.isPending}
                  >
                    <Pause className="h-3 w-3 text-amber-600" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-[#7578EC]/10 rounded-lg transition-all duration-200"
                  onClick={handleResume}
                  disabled={resumeSeriesMutation.isPending}
                >
                  <Play className="h-3 w-3 text-[#7578EC]" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg transition-all duration-200"
              >
                <Settings className="h-3 w-3 text-slate-600" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Progress and Status Section */}
      {!series.is_paused && showDetails && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Serie attiva</span>
            <span className="font-medium">
              {daysUntilDue >= 0 ? `${daysUntilDue} giorni alla prossima` : `In ritardo di ${Math.abs(daysUntilDue)} giorni`}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                isOverdue ? 'bg-gradient-to-r from-red-500 to-red-600' :
                isDueToday ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                daysUntilDue <= 3 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                'bg-gradient-to-r from-[#7578EC] to-[#EC4899]'
              }`}
              style={{
                width: `${Math.max(10, Math.min(100, 100 - (daysUntilDue * 10)))}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Execution Summary */}
      {showDetails && series.total_executions > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="font-semibold text-slate-900">{series.total_executions}</div>
              <div className="text-slate-500">Esecuzioni</div>
            </div>
            <div>
              <div className="font-semibold text-[#7578EC]">
                {formatCurrency(series.amount * series.total_executions)}
              </div>
              <div className="text-slate-500">Totale</div>
            </div>
            <div>
              <div className={`font-semibold ${series.failed_executions > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {Math.round(((series.total_executions - series.failed_executions) / series.total_executions) * 100)}%
              </div>
              <div className="text-slate-500">Successo</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecurringSeriesCardNew;