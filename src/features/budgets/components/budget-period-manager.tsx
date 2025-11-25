"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, History, TrendingUp, TrendingDown, Activity, Users, Calendar } from "lucide-react";
import { BudgetPeriod, Transaction, User, Budget } from "@/lib/types";
import { startPeriodAction, closePeriodAction } from "@/features/budgets/actions/period-actions";
import { FormActions } from "@/src/components/form";
import { DateField } from "@/src/components/ui/fields";
import { Alert, AlertDescription, Badge, ModalContent, ModalSection, ModalWrapper } from "@/src/components/ui";

interface BudgetPeriodManagerProps {
  user: User;
  currentPeriod: BudgetPeriod | null;
  transactions: Transaction[];
  userBudgets: Budget[]; // User's budgets for savings calculation
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function BudgetPeriodManager({
  user,
  currentPeriod,
  transactions,
  userBudgets,
  trigger,
  onSuccess,
}: Readonly<BudgetPeriodManagerProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsActionPending(false);
      setSelectedDate("");
      setError("");
    } else {
      // Pre-fill with current date for both start and close
      setSelectedDate(new Date().toISOString().split("T")[0]);
    }
  }, [isOpen]);

  const isActivePeriod = currentPeriod?.is_active && !currentPeriod?.end_date;

  // Calculate current period metrics
  const periodMetrics = useMemo(() => {
    if (!isActivePeriod || !currentPeriod) {
      return { totalSpent: 0, totalSaved: 0, totalBudget: 0, categorySpending: {} };
    }

    const periodStart = new Date(currentPeriod.start_date);
    const periodEnd = selectedDate ? new Date(selectedDate) : new Date();

    // Filter transactions for this period and user
    const periodTransactions = transactions.filter((t) => {
      if (t.user_id !== user.id) return false;
      const txDate = new Date(t.date);
      return txDate >= periodStart && txDate < periodEnd;
    });

    // Calculate totals
    let totalSpent = 0;
    const categorySpending: Record<string, number> = {};

    periodTransactions.forEach((t) => {
      if (t.type === "expense" || t.type === "transfer") {
        totalSpent += t.amount;
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
      } else if (t.type === "income") {
        totalSpent -= t.amount; // Income refills budget
      }
    });

    totalSpent = Math.max(0, totalSpent);

    // Calculate total budget amount (pro-rated for period length)
    let totalBudget = 0;
    if (userBudgets && userBudgets.length > 0) {
      const periodDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));

      userBudgets.forEach((budget) => {
        if (budget.type === "monthly") {
          // Pro-rate monthly budget based on period length
          const monthlyFraction = periodDays / 30; // Approximate month as 30 days
          totalBudget += budget.amount * monthlyFraction;
        } else if (budget.type === "annually") {
          // Pro-rate annual budget based on period length
          const annualFraction = periodDays / 365;
          totalBudget += budget.amount * annualFraction;
        }
      });
    }

    // Calculate savings: budget - spent
    const totalSaved = Math.max(0, totalBudget - totalSpent);

    return { totalSpent, totalSaved, totalBudget, categorySpending };
  }, [isActivePeriod, currentPeriod, selectedDate, transactions, user.id, userBudgets]);

  // Get all previous periods (closed periods)
  const previousPeriods = useMemo(() => {
    const allPeriods = (user.budget_periods as BudgetPeriod[]) || [];
    return allPeriods
      .filter((p) => !p.is_active && p.end_date)
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  }, [user.budget_periods]);

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Count total periods
  const totalPeriods = ((user.budget_periods as BudgetPeriod[]) || []).length;

  // Handle submit (start new period or close current period)
  const handleSubmit = async () => {
    if (!selectedDate) {
      setError("Seleziona una data");
      return;
    }

    setError("");
    setIsActionPending(true);

    try {
      let result;

      if (isActivePeriod) {
        // Close current period
        result = await closePeriodAction(user.id, selectedDate, transactions);
      } else {
        // Start new period
        result = await startPeriodAction(user.id, selectedDate);
      }

      if (result.error || !result.data) {
        setError(result.error || "Errore durante l'operazione");
        return;
      }

      // Success - call callback and close modal
      onSuccess?.();
      setIsOpen(false);
    } catch (err) {
      console.error("[BudgetPeriodManager] Submit error:", err);
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setIsActionPending(false);
    }
  };

  return (
    <>
      <span onClick={() => setIsOpen(true)}>{trigger}</span>
      <ModalWrapper
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title="Gestione Periodi Budget"
        description="Gestisci i periodi di budget per tracciare le spese nel tempo"
        maxWidth="lg"
        footer={
          <FormActions
            submitType="button"
            onCancel={() => setIsOpen(false)}
            onSubmit={handleSubmit}
            isSubmitting={isActionPending}
            submitLabel={isActivePeriod ? "Chiudi periodo" : "Inizia nuovo periodo"}
            submitVariant="default"
          />
        }
      >
        <ModalContent>
          {/* Error message */}
          {error && (
            <div className="px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
              {error}
            </div>
          )}

          <ModalSection>
            <div className="space-y-4">
              {/* User Info Section */}
              <div className="rounded-xl p-3 border border-primary/10 bg-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-bold text-primary">{user.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary/70 bg-primary/10 px-2 py-1 rounded-full">
                    <History className="h-3 w-3 text-primary/70" />
                    <span>{totalPeriods} periodi</span>
                  </div>
                </div>
              </div>

              {/* Current Period Status */}
              <div className="bg-card rounded-xl p-4 border border-primary/10 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-primary">Periodo Corrente</h3>
                </div>

                {isActivePeriod ? (
                  <div className="space-y-3">
                    {/* Period Status Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-sm font-medium text-black">
                        Iniziato il {formatDate(currentPeriod.start_date)}
                      </span>
                      <Badge className="bg-white text-primary shadow-sm self-start sm:self-auto">
                        <Activity className="h-3 w-3 mr-1" />
                        In corso
                      </Badge>
                    </div>

                    {/* Financial Metrics - Summary Only */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-lg p-3 border border-destructive/20 bg-destructive/5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <TrendingDown className="h-3 w-3 text-destructive" />
                          <p className="text-xs font-bold text-destructive uppercase tracking-wide">Speso</p>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-destructive">
                          {formatCurrency(periodMetrics.totalSpent)}
                        </p>
                      </div>
                      <div className="rounded-lg p-3 border border-primary/20 bg-primary/5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <TrendingUp className="h-3 w-3 text-primary" />
                          <p className="text-xs font-bold text-primary uppercase tracking-wide">Risparmiato</p>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-primary">
                          {formatCurrency(periodMetrics.totalSaved)}
                        </p>
                      </div>
                    </div>

                    {/* End Date Selection */}
                    <div className="space-y-2 overflow-hidden">
                      <DateField
                        label="Data di Fine Periodo"
                        value={selectedDate}
                        onChange={setSelectedDate}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Alert */}
                    <Alert>
                      <AlertDescription className="text-black font-medium">
                        Nessun periodo attivo. Inizia un nuovo periodo per tracciare le spese del budget.
                      </AlertDescription>
                    </Alert>

                    {/* Start Date Selection */}
                    <div className="space-y-2 overflow-hidden">
                      <DateField
                        label="Data di Inizio Periodo"
                        value={selectedDate}
                        onChange={setSelectedDate}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Previous Periods List */}
              {previousPeriods.length > 0 && (
                <div className="bg-card rounded-xl p-4 border border-primary/10 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <History className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-base font-bold text-primary">Periodi Precedenti</h3>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {previousPeriods.map((period) => (
                      <div
                        key={period.id}
                        className="rounded-lg p-3 border border-primary/10 bg-primary/5 hover:bg-primary/10 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Calendar className="h-3 w-3 text-primary shrink-0" />
                            <span className="text-xs font-medium text-black truncate">
                              {formatDate(period.start_date)} -{" "}
                              {period.end_date ? formatDate(period.end_date) : "In corso"}
                            </span>
                          </div>
                          <Badge variant="outline" className="bg-white text-xs text-primary shrink-0">
                            Chiuso
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center p-2 bg-destructive/10 rounded-md">
                            <p className="text-xs font-bold text-destructive uppercase tracking-wide mb-0.5">Speso</p>
                            <p className="text-sm font-bold text-destructive">
                              {formatCurrency(period.total_spent || 0)}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-primary/10 rounded-md">
                            <p className="text-xs font-bold text-primary uppercase tracking-wide mb-0.5">Risparmiato</p>
                            <p className="text-sm font-bold text-primary">{formatCurrency(period.total_saved || 0)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ModalSection>
        </ModalContent>
      </ModalWrapper>
    </>
  );
}

// Export with displayName for debugging
BudgetPeriodManager.displayName = "BudgetPeriodManager";
