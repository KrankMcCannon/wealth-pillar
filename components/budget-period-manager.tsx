"use client";

import { useState } from "react";
import { Calendar, Clock, Play, Square, History, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import type { Budget, BudgetPeriod } from "@/lib/types";
import {
  useBudgetPeriods,
  useStartBudgetPeriod,
  useEndBudgetPeriod
} from "@/hooks";

interface BudgetPeriodManagerProps {
  budget: Budget;
  currentPeriod: BudgetPeriod | null;
  trigger: React.ReactNode;
}

export function BudgetPeriodManager({ budget, currentPeriod, trigger }: BudgetPeriodManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: allPeriods = [], isLoading } = useBudgetPeriods();
  const startPeriodMutation = useStartBudgetPeriod();
  const endPeriodMutation = useEndBudgetPeriod();

  // Get periods for this budget's user (periods are now user-level)
  const budgetPeriods = allPeriods.filter((period: BudgetPeriod) => period.user_id === budget.user_id);

  const formatDate = (date: Date | string | null) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleStartNewPeriod = async () => {
    try {
      await startPeriodMutation.mutateAsync({
        userId: budget.user_id,
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error starting new period:', error);
    }
  };

  const handleEndCurrentPeriod = async () => {
    if (!currentPeriod) return;

    try {
      await endPeriodMutation.mutateAsync(budget.user_id);
      setIsOpen(false);
    } catch (error) {
      console.error('Error ending current period:', error);
    }
  };

  const isActivePeriod = currentPeriod?.is_active && !currentPeriod?.end_date;
  const historicalPeriods = budgetPeriods.filter((p: BudgetPeriod) => !p.is_active || p.end_date);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Gestione Periodi Budget
          </DialogTitle>
          <DialogDescription>
            Gestisci i periodi del budget &quot;{budget.description}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Period Status */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Periodo Corrente
            </h3>

            {isActivePeriod ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    Iniziato il {formatDate(currentPeriod.start_date)}
                  </span>
                  <Badge variant="default" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    In corso
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg px-3 py-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                      Speso
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {formatCurrency(currentPeriod.total_spent)}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg px-3 py-2">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                      Risparmiato
                    </p>
                    <p className="text-sm font-bold text-emerald-600">
                      {formatCurrency(currentPeriod.total_saved)}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleEndCurrentPeriod}
                  disabled={endPeriodMutation.isPending}
                  size="sm"
                  variant="outline"
                  className="w-full border-red-200 text-red-700 hover:bg-red-50"
                >
                  <Square className="h-4 w-4 mr-2" />
                  {endPeriodMutation.isPending ? 'Terminando...' : 'Termina Periodo'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nessun periodo attivo. Inizia un nuovo periodo per tracciare le spese.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleStartNewPeriod}
                  disabled={startPeriodMutation.isPending}
                  size="sm"
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {startPeriodMutation.isPending ? 'Iniziando...' : 'Inizia Nuovo Periodo'}
                </Button>
              </div>
            )}
          </div>

          {/* Historical Periods */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Storico Periodi ({historicalPeriods.length})
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : historicalPeriods.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {historicalPeriods
                  .sort((a: BudgetPeriod, b: BudgetPeriod) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
                  .map((period: BudgetPeriod) => (
                    <div
                      key={period.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">
                            {formatDate(period.start_date)} - {formatDate(period.end_date)}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Concluso
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <p className="text-xs text-slate-600">Speso</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatCurrency(period.total_spent)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-emerald-700">Risparmiato</p>
                          <p className="text-sm font-semibold text-emerald-600">
                            {formatCurrency(period.total_saved)}
                          </p>
                        </div>
                      </div>

                      {/* Top spending categories */}
                      {period.category_spending && Object.keys(period.category_spending).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                            Principali Categorie
                          </p>
                          <div className="space-y-1">
                            {Object.entries(period.category_spending as Record<string, number>)
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .slice(0, 3)
                              .map(([category, amount]: [string, number]) => (
                                <div key={category} className="flex items-center justify-between">
                                  <span className="text-xs text-slate-600 capitalize">
                                    {category.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-900">
                                    {formatCurrency(amount)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm">Nessun periodo storico disponibile</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
