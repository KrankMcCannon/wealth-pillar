"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, TrendingUp, TrendingDown, Activity, Users } from "lucide-react";
import { BudgetPeriod, Transaction, Budget, User } from "@/lib/types";
import { startPeriodAction, closePeriodAction } from "@/features/budgets/actions/budget-period-actions";
import { FormActions } from "@/components/form";
import { DateField, UserField } from "@/components/ui/fields";
import { Alert, AlertDescription, Badge, ModalContent, ModalSection, ModalWrapper } from "@/components/ui";
import { usePermissions } from "@/hooks";
import { toDateTime } from "@/lib/utils/date-utils";
import { usePageDataStore } from "@/stores/page-data-store";
import { budgetStyles } from "@/styles/system";

interface BudgetPeriodManagerProps {
  selectedUserId?: string; // Initial user selection
  currentPeriod: BudgetPeriod | null;
  transactions: Transaction[];
  userBudgets: Budget[]; // User's budgets for savings calculation
  trigger: React.ReactNode;
  onSuccess?: () => void;
  onUserChange?: (userId: string) => void; // Callback when user selection changes
  currentUser: User;
  groupUsers: User[];
}

export function BudgetPeriodManager({
  selectedUserId,
  currentPeriod,
  transactions,
  userBudgets,
  trigger,
  onSuccess,
  onUserChange,
  currentUser,
  groupUsers,
}: Readonly<BudgetPeriodManagerProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [internalSelectedUserId, setInternalSelectedUserId] = useState<string>(selectedUserId || currentUser.id);

  // Permission checks
  const { isAdmin, shouldDisableUserField } = usePermissions({ currentUser });

  // Get the target user (selected or current)
  const targetUser = useMemo(() => {
    return groupUsers.find((u) => u.id === internalSelectedUserId) || currentUser;
  }, [groupUsers, internalSelectedUserId, currentUser]);

  // Update internal user selection when prop changes
  useEffect(() => {
    if (selectedUserId) {
      setInternalSelectedUserId(selectedUserId);
    }
  }, [selectedUserId]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Pre-fill with current date for both start and close
      setSelectedDate(new Date().toISOString().split("T")[0]);
    } else {
      setIsActionPending(false);
      setSelectedDate("");
      setError("");
      setInternalSelectedUserId(selectedUserId || currentUser.id);
    }
  }, [isOpen, selectedUserId, currentUser.id]);

  const isActivePeriod = currentPeriod?.is_active && !currentPeriod?.end_date;

  // Calculate current period metrics based on selected end date
  // Uses same logic as dashboard (BudgetService.calculateBudgetProgress)
  const periodMetrics = useMemo(() => {
    if (!isActivePeriod || !currentPeriod) {
      return { totalSpent: 0, totalSaved: 0, totalBudget: 0, categorySpending: {} };
    }

    const periodStart = toDateTime(currentPeriod.start_date);
    const periodEnd = selectedDate
      ? toDateTime(selectedDate)?.endOf("day")
      : toDateTime(new Date().toISOString().split("T")[0])?.endOf("day");

    // Filter transactions for this period and target user
    const periodTransactions = transactions.filter((t) => {
      if (t.user_id !== targetUser.id) return false;
      const txDate = toDateTime(t.date);
      if (!txDate || !periodStart || !periodEnd) return false;
      return txDate >= periodStart && txDate <= periodEnd;
    });

    // Calculate totals by processing each budget individually (like BudgetService)
    let totalBudget = 0;
    let totalSpent = 0;
    const categorySpending: Record<string, number> = {};

    if (userBudgets && userBudgets.length > 0) {
      // Filter out budgets with 0€ amount (same as BudgetService)
      const validBudgets = userBudgets.filter((b) => b.amount > 0);

      validBudgets.forEach((budget) => {
        // Add budget amount to total
        totalBudget += budget.amount;

        // Filter transactions for this specific budget's categories
        // Include expense, transfer, and income for correct calculation
        const budgetTransactions = periodTransactions.filter((t) => {
          return budget.categories.includes(t.category);
        });

        // Calculate spent for this budget (income refills, expense/transfer consume)
        const budgetSpent = budgetTransactions.reduce((sum, t) => {
          if (t.type === "income") {
            return sum - t.amount; // Income refills budget
          }
          return sum + t.amount; // Expense and transfer consume budget
        }, 0);

        // Add to total spent (ensure non-negative)
        totalSpent += Math.max(0, budgetSpent);

        // Track category spending (expense and transfer)
        budgetTransactions.forEach((t) => {
          if (t.type === "expense" || t.type === "transfer") {
            categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
          }
        });
      });
    }

    // Calculate savings: budget - spent
    const totalSaved = Math.max(0, totalBudget - totalSpent);

    return { totalSpent, totalSaved, totalBudget, categorySpending };
  }, [isActivePeriod, currentPeriod, selectedDate, transactions, targetUser.id, userBudgets]);

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const dt = toDateTime(dateString);
    if (!dt) return "Data non valida";
    return dt.toFormat("d LLL yyyy", { locale: "it" });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Get store updater for optimistic UI
  const updateBudgetPeriod = usePageDataStore((state) => state.updateBudgetPeriod);

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

      if (isActivePeriod && currentPeriod) {
        // Close current period using period ID and pre-calculated metrics
        result = await closePeriodAction(currentPeriod.id, selectedDate);

        // Optimistic UI update - mark period as closed
        if (!result.error && result.data) {
          updateBudgetPeriod(targetUser.id, result.data);
        }
      } else {
        // Start new period
        result = await startPeriodAction(targetUser.id, selectedDate);

        // Optimistic UI update - set new active period
        if (!result.error && result.data) {
          updateBudgetPeriod(targetUser.id, result.data);
        }
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
            <div className={budgetStyles.periodManager.error}>
              {error}
            </div>
          )}

          <ModalSection>
            <div className={budgetStyles.periodManager.body}>
              {/* User Selection (Admin) or User Info (Member) */}
              {isAdmin ? (
                <UserField
                  label="Utente"
                  users={groupUsers}
                  value={internalSelectedUserId}
                  onChange={(userId) => {
                    setInternalSelectedUserId(userId);
                    onUserChange?.(userId);
                  }}
                  disabled={shouldDisableUserField}
                  helperText={
                    shouldDisableUserField
                      ? "Puoi gestire solo i tuoi periodi"
                      : "Seleziona l'utente di cui gestire il periodo budget"
                  }
                />
              ) : (
                <div className={budgetStyles.periodManager.userCard}>
                  <div className={budgetStyles.periodManager.userRow}>
                    <div className={budgetStyles.periodManager.userIconWrap}>
                      <Users className={budgetStyles.periodManager.userIcon} />
                    </div>
                    <span className={budgetStyles.periodManager.userName}>{targetUser.name}</span>
                  </div>
                </div>
              )}

              {/* Current Period Status */}
              <div className={budgetStyles.periodManager.periodCard}>
                <div className={budgetStyles.periodManager.periodHeader}>
                  <div className={budgetStyles.periodManager.userIconWrap}>
                    <Clock className={budgetStyles.periodManager.userIcon} />
                  </div>
                  <h3 className={budgetStyles.periodManager.periodTitle}>Periodo Corrente</h3>
                </div>

                {isActivePeriod ? (
                  <div className={budgetStyles.periodManager.periodContent}>
                    {/* Period Status Header */}
                    <div className={budgetStyles.periodManager.periodRow}>
                      <span className={budgetStyles.periodManager.periodDate}>
                        Iniziato il {formatDate(currentPeriod.start_date)}
                      </span>
                      <Badge className={budgetStyles.periodManager.periodBadge}>
                        <Activity className={budgetStyles.periodManager.periodBadgeIcon} />
                        In corso
                      </Badge>
                    </div>

                    {/* Financial Metrics - Summary Only */}
                    <div className={budgetStyles.periodManager.metricsGrid}>
                      <div className={budgetStyles.periodManager.metricCardSpent}>
                        <div className={budgetStyles.periodManager.metricRow}>
                          <TrendingDown className={budgetStyles.periodManager.metricIconSpent} />
                          <p className={budgetStyles.periodManager.metricLabelSpent}>Speso</p>
                        </div>
                        <p className={budgetStyles.periodManager.metricValueSpent}>
                          {formatCurrency(periodMetrics.totalSpent)}
                        </p>
                      </div>
                      <div className={budgetStyles.periodManager.metricCardSaved}>
                        <div className={budgetStyles.periodManager.metricRow}>
                          <TrendingUp className={budgetStyles.periodManager.metricIconSaved} />
                          <p className={budgetStyles.periodManager.metricLabelSaved}>Risparmiato</p>
                        </div>
                        <p className={budgetStyles.periodManager.metricValueSaved}>
                          {formatCurrency(periodMetrics.totalSaved)}
                        </p>
                      </div>
                    </div>

                    {/* End Date Selection */}
                    <div className={budgetStyles.periodManager.dateFieldWrap}>
                      <DateField
                        label="Data di Fine Periodo"
                        value={selectedDate}
                        onChange={setSelectedDate}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className={budgetStyles.periodManager.periodContent}>
                    {/* Alert */}
                    <Alert>
                      <AlertDescription className={budgetStyles.periodManager.alertText}>
                        Nessun periodo attivo. Inizia un nuovo periodo per tracciare le spese del budget.
                      </AlertDescription>
                    </Alert>

                    {/* Start Date Selection */}
                    <div className={budgetStyles.periodManager.dateFieldWrap}>
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
            </div>
          </ModalSection>
        </ModalContent>
      </ModalWrapper>
    </>
  );
}

// Export with displayName for debugging
BudgetPeriodManager.displayName = "BudgetPeriodManager";
