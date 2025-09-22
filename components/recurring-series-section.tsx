'use client';

import { useState } from 'react';
import { ChevronRight, Calendar, Repeat, Filter, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RecurringSeriesCardNew } from './recurring-series-card-new';
import { SectionHeader } from './section-header';
import { formatCurrency } from '@/lib/utils';
import {
  useActiveRecurringSeries,
  useUpcomingRecurringSeries,
  useRecurringSeriesStats
} from '@/hooks';

interface RecurringSeriesSectionProps {
  selectedUserId?: string;
  className?: string;
  showStats?: boolean;
  maxItems?: number;
  showActions?: boolean;
}

export function RecurringSeriesSection({
  selectedUserId = 'all',
  className = '',
  showStats = true,
  maxItems = 5,
  showActions = false
}: RecurringSeriesSectionProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'all'>('upcoming');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');

  // Get data using new hooks
  const {
    data: activeSeries = [],
    isLoading: activeLoading
  } = useActiveRecurringSeries(selectedUserId !== 'all' ? selectedUserId : undefined);

  const {
    data: upcomingSeries = [],
    isLoading: upcomingLoading
  } = useUpcomingRecurringSeries(7, selectedUserId !== 'all' ? selectedUserId : undefined);

  const {
    data: stats,
    isLoading: statsLoading
  } = useRecurringSeriesStats(selectedUserId !== 'all' ? selectedUserId : undefined);

  // Apply type filter
  const getFilteredSeries = (series: typeof activeSeries) => {
    if (typeFilter === 'all') return series;
    return series.filter(s => s.type === typeFilter);
  };

  const filteredActiveSeries = getFilteredSeries(activeSeries);
  const filteredUpcomingSeries = getFilteredSeries(upcomingSeries);

  // Determine which series to show
  const displayedSeries = activeTab === 'upcoming' ? filteredUpcomingSeries : filteredActiveSeries;
  const limitedSeries = displayedSeries.slice(0, maxItems);

  const isLoading = activeLoading || upcomingLoading || statsLoading;

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (displayedSeries.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <SectionHeader
          title="Serie Ricorrenti"
          subtitle="Gestisci i tuoi abbonamenti e pagamenti ricorrenti"
          className="mb-4"
        />
        <div className="text-center py-8 text-slate-500">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7578EC]/10 to-[#7578EC]/5 mx-auto mb-4">
            <Repeat className="w-8 h-8 text-[#7578EC]" />
          </div>
          <p className="font-medium text-slate-900">Nessuna serie ricorrente trovata</p>
          <p className="text-sm mt-1">
            Le serie ricorrenti configurate appariranno qui
          </p>
          <Button
            variant="outline"
            className="mt-4 bg-white/80 border-slate-200/50 text-slate-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] hover:border-[#7578EC]/30 transition-all duration-200 rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi Serie
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header with Stats */}
      <div className="flex items-center justify-between mb-6">
        <SectionHeader
          title="Serie Ricorrenti"
          subtitle={
            showStats && stats
              ? `${stats.totalActiveSeries} serie attive • Impatto mensile: ${formatCurrency(stats.totalMonthlyImpact)}`
              : `${displayedSeries.length} ${displayedSeries.length === 1 ? 'serie trovata' : 'serie trovate'}`
          }
        />

        {showStats && stats && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-slate-600">{stats.totalExpenseSeries} Uscite</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-slate-600">{stats.totalIncomeSeries} Entrate</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs and Filters */}
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upcoming' | 'all')}>
          <div className="flex items-center justify-between">
            <TabsList className="grid grid-cols-2 w-64">
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                In Scadenza
                {filteredUpcomingSeries.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {filteredUpcomingSeries.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                Tutte
                {filteredActiveSeries.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {filteredActiveSeries.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as 'all' | 'expense' | 'income')}>
                <SelectTrigger className="w-32 bg-white/80 border-slate-200/50 rounded-xl shadow-sm hover:border-[#7578EC]/30 transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutto</SelectItem>
                  <SelectItem value="expense">Uscite</SelectItem>
                  <SelectItem value="income">Entrate</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/80 border-slate-200/50 text-slate-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] hover:border-[#7578EC]/30 transition-all duration-200 rounded-xl shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuova Serie
              </Button>
            </div>
          </div>

          <TabsContent value="upcoming" className="mt-4">
            <div className="space-y-3">
              {limitedSeries.map((series) => (
                <RecurringSeriesCardNew
                  key={series.id}
                  series={series}
                  showDetails={true}
                  showActions={showActions}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <div className="space-y-3">
              {limitedSeries.map((series) => (
                <RecurringSeriesCardNew
                  key={series.id}
                  series={series}
                  showDetails={false}
                  showActions={showActions}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* View All Button */}
      {displayedSeries.length > maxItems && (
        <div className="flex justify-center pt-4 border-t border-slate-100">
          <Button
            variant="ghost"
            className="text-sm font-medium text-slate-600 hover:text-[#7578EC] hover:bg-[#7578EC]/10 transition-all duration-200"
          >
            Visualizza tutte le {displayedSeries.length} serie
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Quick Stats Footer */}
      {showStats && stats && activeTab === 'all' && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-[#7578EC]">
                {formatCurrency(stats.averageAmount)}
              </div>
              <div className="text-xs text-slate-500">Importo Medio</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">
                {stats.nextDueDateSeries.length}
              </div>
              <div className="text-xs text-slate-500">In Arrivo</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">
                {formatCurrency(Math.abs(stats.totalMonthlyImpact))}
              </div>
              <div className="text-xs text-slate-500">Impatto Mensile</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default RecurringSeriesSection;