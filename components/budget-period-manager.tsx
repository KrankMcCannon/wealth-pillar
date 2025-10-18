"use client";

import { useState, useEffect } from "react";
import { Clock, Play, Save, History, AlertCircle, TrendingUp, TrendingDown, Activity, Calendar, Users, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency, calculateUserFinancialTotals } from "@/lib/utils";
import type { Budget, BudgetPeriod } from "@/lib/types";
import {
  useStartBudgetPeriod,
  useEndBudgetPeriod,
  useBudgetPeriods,
  useUsers,
  useBudgets,
  useTransactions
} from "@/hooks";

interface BudgetPeriodManagerProps {
  budget: Budget;
  currentPeriod: BudgetPeriod | null;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function BudgetPeriodManager({ budget, currentPeriod, trigger, onSuccess }: BudgetPeriodManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);
  const [endDate, setEndDate] = useState<string>('');

  const startPeriodMutation = useStartBudgetPeriod();
  const endPeriodMutation = useEndBudgetPeriod();
  const { data: allPeriods = [] } = useBudgetPeriods();
  const { data: users = [] } = useUsers();
  const { data: allBudgets = [] } = useBudgets();
  const { data: allTransactions = [] } = useTransactions();

  // Reset action pending state when mutations complete
  useEffect(() => {
    if (!startPeriodMutation.isPending && !endPeriodMutation.isPending) {
      setIsActionPending(false);
    }
  }, [startPeriodMutation.isPending, endPeriodMutation.isPending]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsActionPending(false);
      setEndDate(''); // Reset end date input
    }
  }, [isOpen]);

  const formatDate = (date: Date | string | null) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calcola il numero di periodi chiusi per l'utente
  const getClosedPeriodsCount = () => {
    return allPeriods.filter((period: BudgetPeriod) =>
      period.user_id === (budget.user_id) && (!period.is_active || period.end_date)
    ).length;
  };

  // Calcola i totali spese e risparmi del periodo corrente
  const calculatePeriodTotals = () => {
    const user = users.find(u => u.id === budget.user_id);
    if (!user) return { totalSpent: 0, totalSaved: 0 };

    const userBudgets = allBudgets.filter(b => b.user_id === budget.user_id);
    const totals = calculateUserFinancialTotals(user, userBudgets, allTransactions);

    return {
      totalSpent: totals.totalSpent || 0,
      totalSaved: totals.totalSaved || 0
    };
  };

  const handleStartNewPeriod = async () => {
    setIsActionPending(true);
    try {
      await startPeriodMutation.mutateAsync({
        userId: budget.user_id,
      });
      setIsActionPending(false);
      setIsOpen(false); // Close modal after successful creation
      onSuccess?.(); // Call the callback to close dropdown
    } catch (error) {
      console.error('Error starting new period:', error);
      setIsActionPending(false);
    }
  };

  const handleEndCurrentPeriod = async () => {
    if (!currentPeriod || !endDate) return;

    setIsActionPending(true);
    try {
      const parsed = new Date(endDate);
      if (!isNaN(parsed.getTime())) {
        parsed.setHours(23, 59, 59, 999);
      }
      const endDateIso = isNaN(parsed.getTime()) ? undefined : parsed.toISOString();

      await endPeriodMutation.mutateAsync({
        userId: budget.user_id,
        endDate: endDateIso
      });
      setIsActionPending(false);
      setEndDate(''); // Reset end date
      onSuccess?.(); // Call the callback to close dropdown
    } catch (error) {
      console.error('Error ending current period:', error);
      setIsActionPending(false);
    }
  };

  const isActivePeriod = currentPeriod?.is_active && !currentPeriod?.end_date;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="p-0 gap-0 max-w-[95vw] w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col bg-white border border-[#7578EC]/20 shadow-2xl rounded-2xl" showCloseButton={false}>
        <DialogTitle className="sr-only">Gestione Periodi Budget</DialogTitle>

        {/* Custom Header with Close Button */}
        <div className="bg-[#7578EC] p-4 rounded-t-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <History className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">Gestione Periodi Budget</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 p-0 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="flex-1 p-4 pt-3 space-y-4 overflow-y-auto scrollbar-thin min-h-0">
          {/* User Info Section */}
          <div className="bg-slate-50 rounded-xl p-3 border border-[#7578EC]/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#7578EC]/10 rounded-lg">
                  <Users className="h-4 w-4 text-[#7578EC]" />
                </div>
                <span className="text-sm font-bold text-black">
                  {users.find(user => user.id === budget.user_id)?.name || 'Utente non trovato'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-black/60 bg-[#7578EC]/10 px-2 py-1 rounded-full">
                <History className="h-3 w-3 text-[#7578EC]/70" />
                <span>
                  {getClosedPeriodsCount() === 1
                    ? `${getClosedPeriodsCount()} periodo chiuso`
                    : `${getClosedPeriodsCount()} periodi chiusi`
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Current Period Status */}
          <div className="bg-white rounded-xl p-4 border border-[#7578EC]/20 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-[#7578EC]/10 rounded-lg">
                <Clock className="h-4 w-4 text-[#7578EC]" />
              </div>
              <h3 className="text-base font-bold text-black">
                Periodo Corrente
              </h3>
            </div>

            {isActivePeriod ? (
              <div className="space-y-3">
                {/* Period Status Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-sm font-medium text-black">
                    Iniziato il {formatDate(currentPeriod.start_date)}
                  </span>
                  <Badge className="bg-[#7578EC] text-white shadow-sm self-start sm:self-auto">
                    <Activity className="h-3 w-3 mr-1" />
                    In corso
                  </Badge>
                </div>

                {/* Financial Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#DC2626]/10 rounded-lg p-3 border border-[#DC2626]/20 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingDown className="h-3 w-3 text-[#DC2626]" />
                      <p className="text-xs font-bold text-[#DC2626] uppercase tracking-wide">
                        Speso
                      </p>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-[#DC2626]">
                      {formatCurrency(calculatePeriodTotals().totalSpent)}
                    </p>
                  </div>
                  <div className="bg-[#6BBEB4]/15 rounded-lg p-3 border border-[#6BBEB4]/30 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp className="h-3 w-3 text-[#6BBEB4]" />
                      <p className="text-xs font-bold text-[#6BBEB4] uppercase tracking-wide">
                        Risparmiato
                      </p>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-[#6BBEB4]">
                      {formatCurrency(calculatePeriodTotals().totalSaved)}
                    </p>
                  </div>
                </div>

                {/* End Date Selection */}
                <div className="space-y-2 overflow-hidden">
                  <Label htmlFor="end-date" className="text-sm font-medium text-black">
                    Data di Fine Periodo
                  </Label>
                  <div className="relative w-full max-w-full">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7578EC] pointer-events-none z-10" />
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={currentPeriod?.start_date ? new Date(currentPeriod.start_date).toISOString().split('T')[0] : ''}
                      className="w-full max-w-full pl-10 pr-8 border-[#7578EC]/30 focus:border-[#7578EC] focus:ring-[#7578EC]/20 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-date-and-time-value]:text-ellipsis [&::-webkit-date-and-time-value]:overflow-hidden"
                    />
                  </div>
                </div>

                {/* Period Totals (when end date is selected) */}
                {endDate && currentPeriod && (
                  <div className="space-y-3 p-3 bg-[#7578EC]/8 rounded-lg border border-[#7578EC]/20">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-[#7578EC]" />
                      <h4 className="text-sm font-bold text-black">Riepilogo Periodo</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-[#DC2626]/10 rounded-md border border-[#DC2626]/20">
                        <p className="text-xs font-bold text-[#DC2626] uppercase tracking-wide mb-0.5">Speso Totale</p>
                        <p className="text-sm font-bold text-[#DC2626]">
                          {formatCurrency(calculatePeriodTotals().totalSpent)}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-[#6BBEB4]/15 rounded-md border border-[#6BBEB4]/20">
                        <p className="text-xs font-bold text-[#6BBEB4] uppercase tracking-wide mb-0.5">Risparmiato</p>
                        <p className="text-sm font-bold text-[#6BBEB4]">
                          {formatCurrency(calculatePeriodTotals().totalSaved)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleEndCurrentPeriod}
                  disabled={isActionPending || !endDate}
                  size="default"
                  variant="outline"
                  className="w-full h-10 bg-[#7578EC] hover:bg-[#7578EC]/90 text-white transition-all duration-200 active:scale-[.98] font-semibold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isActionPending ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3 mr-2" />
                      Salva Periodo
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Alert */}
                <Alert className="border-[#7578EC]/30 bg-[#7578EC]/8">
                  <AlertCircle className="h-4 w-4 text-[#7578EC]" />
                  <AlertDescription className="text-black font-medium">
                    Nessun periodo attivo. Inizia un nuovo periodo per tracciare le spese del budget.
                  </AlertDescription>
                </Alert>

                {/* Start Button */}
                <Button
                  onClick={handleStartNewPeriod}
                  disabled={isActionPending}
                  size="default"
                  className="w-full h-10 bg-[#7578EC] hover:bg-[#7578EC]/90 text-white transition-all duration-200 active:scale-[.98] font-semibold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isActionPending ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                      Iniziando...
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-2" />
                      Inizia Nuovo Periodo
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export with displayName for debugging
BudgetPeriodManager.displayName = "BudgetPeriodManager";
