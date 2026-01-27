"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, TrendingUp, TrendingDown, Activity, Users } from "lucide-react";
import { BudgetPeriod, User } from "@/lib/types";
import { startPeriodAction, closePeriodAction, getPeriodPreviewAction } from "@/features/budgets";
import { FormActions } from "@/components/form";
import { DateField, UserField } from "@/components/ui/fields";
import { Alert, AlertDescription, Badge, ModalBody, ModalFooter, ModalSection, ModalWrapper } from "@/components/ui";
import { usePermissions } from "@/hooks";
import { toDateTime } from "@/lib/utils/date-utils";
import { usePageDataStore } from "@/stores/page-data-store";
import { budgetStyles } from "@/styles/system";

interface BudgetPeriodManagerProps {
  selectedUserId?: string; // Initial user selection
  currentPeriod: BudgetPeriod | null;
  trigger: React.ReactNode;
  onSuccess?: () => void;
  onUserChange?: (userId: string) => void; // Callback when user selection changes
  currentUser: User;
  groupUsers: User[];
}

export function BudgetPeriodManager({
  selectedUserId,
  currentPeriod,
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

  // State for metrics
  const [metrics, setMetrics] = useState({
    totalSpent: 0,
    totalSaved: 0,
    totalBudget: 0,
    categorySpending: {} as Record<string, number>
  });

  // Fetch metrics when date changes
  useEffect(() => {
    let mounted = true;

    async function fetchMetrics() {
      // Determine dates
      const rawStart = currentPeriod?.start_date;
      const endDate = selectedDate || new Date().toISOString().split("T")[0];

      if (!rawStart) return;

      // Ensure startDate is string
      const startDate = rawStart instanceof Date ? rawStart.toISOString() : rawStart;

      try {
        // Call Server Action
        const result = await getPeriodPreviewAction(targetUser.id, startDate, endDate);

        if (mounted && result.data) {
          setMetrics({
            totalSpent: result.data.totalSpent,
            totalSaved: result.data.totalSaved,
            totalBudget: result.data.totalBudget,
            categorySpending: result.data.categorySpending
          });
        }
      } catch (e) {
        console.error("Failed to fetch metrics", e);
      }
    }

    // Only run if we have a current period (active or not)
    if (currentPeriod) {
      fetchMetrics();
    }

    return () => { mounted = false; };
  }, [selectedDate, currentPeriod, targetUser.id]);

  // Use metrics state
  const periodMetrics = metrics;

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
        result = await closePeriodAction(targetUser.id, currentPeriod.id, selectedDate);

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
      >
        <ModalBody>
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

        </ModalBody>
        <ModalFooter>
          <FormActions
            submitType="button"
            onCancel={() => setIsOpen(false)}
            onSubmit={handleSubmit}
            isSubmitting={isActionPending}
            submitLabel={isActivePeriod ? "Chiudi periodo" : "Inizia nuovo periodo"}
            submitVariant="default"
          />
        </ModalFooter>
      </ModalWrapper >
    </>
  );
}

// Export with displayName for debugging
BudgetPeriodManager.displayName = "BudgetPeriodManager";
