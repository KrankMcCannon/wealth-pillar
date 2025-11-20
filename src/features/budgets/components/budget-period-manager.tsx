"use client";

import { useState, useEffect } from "react";
import { Clock, History, TrendingUp, TrendingDown, Activity, Users, Target } from "lucide-react";
import { Budget, BudgetPeriod } from "@/src/lib";
import {
  FormActions,
  FormDatePicker,
  FormField,
} from "@/src/components/form";
import {
  Alert,
  AlertDescription,
  Badge,
  ModalContent,
  ModalSection,
  ModalWrapper,
} from "@/src/components/ui";

interface BudgetPeriodManagerProps {
  budget: Budget;
  currentPeriod: BudgetPeriod | null;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function BudgetPeriodManager({ currentPeriod, trigger }: BudgetPeriodManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);
  const [endDate, setEndDate] = useState<string>("");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsActionPending(false);
      setEndDate(""); // Reset end date input
    }
  }, [isOpen]);

  const isActivePeriod = currentPeriod?.is_active && !currentPeriod?.end_date;

  return (
    <>
      <span onClick={() => setIsOpen(true)}>{trigger}</span>
      <ModalWrapper
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title="Gestione Periodi Budget"
        description={undefined}
        maxWidth="lg"
        footer={
          <FormActions
            submitType="button"
            onCancel={() => setIsOpen(false)}
            onSubmit={() => {}}
            isSubmitting={isActionPending}
            submitLabel={isActivePeriod ? "Chiudi periodo" : "Inizia nuovo periodo"}
            submitVariant="default"
          />
        }
      >
        <ModalContent>
          <ModalSection>
            <div className="space-y-4">
              {/* User Info Section */}
              <div className="rounded-xl p-3 border border-primary/10 bg-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-bold text-primary">{"Utente non trovato"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary/70 bg-primary/10 px-2 py-1 rounded-full">
                    <History className="h-3 w-3 text-primary/70" />
                    <span></span>
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
                      <span className="text-sm font-medium text-foreground">Iniziato il {""}</span>
                      <Badge className="bg-primary text-primary-foreground shadow-sm self-start sm:self-auto">
                        <Activity className="h-3 w-3 mr-1" />
                        In corso
                      </Badge>
                    </div>

                    {/* Financial Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-lg p-3 border border-destructive/20 hover:shadow-md transition-all duration-200 bg-destructive/10">
                        <div className="flex items-center gap-1.5 mb-1">
                          <TrendingDown className="h-3 w-3 text-destructive" />
                          <p className="text-xs font-bold text-destructive uppercase tracking-wide">Speso</p>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-destructive">{0}</p>
                      </div>
                      <div className="rounded-lg p-3 border border-primary/20 hover:shadow-md transition-all duration-200 bg-primary/10">
                        <div className="flex items-center gap-1.5 mb-1">
                          <TrendingUp className="h-3 w-3 text-primary" />
                          <p className="text-xs font-bold text-primary uppercase tracking-wide">Risparmiato</p>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-primary">{0}</p>
                      </div>
                    </div>

                    {/* End Date Selection */}
                    <div className="space-y-2 overflow-hidden">
                      <FormField label="Data di Fine Periodo">
                        <FormDatePicker
                          value={endDate}
                          onChange={setEndDate}
                          minDate={currentPeriod?.start_date ? new Date(currentPeriod.start_date) : undefined}
                        />
                      </FormField>
                    </div>

                    {/* Period Totals (when end date is selected) */}
                    {endDate && currentPeriod && (
                      <div className="space-y-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          <h4 className="text-sm font-bold text-primary">Riepilogo Periodo</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-2 bg-destructive/10 rounded-md border border-destructive/20">
                            <p className="text-xs font-bold text-destructive uppercase tracking-wide mb-0.5">
                              Speso Totale
                            </p>
                            <p className="text-sm font-bold text-destructive">{0}</p>
                          </div>
                          <div className="text-center p-2 bg-primary/10 rounded-md border border-primary/20">
                            <p className="text-xs font-bold text-primary uppercase tracking-wide mb-0.5">Risparmiato</p>
                            <p className="text-sm font-bold text-primary">{0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Alert */}
                    <Alert>
                      <AlertDescription className="text-foreground font-medium">
                        Nessun periodo attivo. Inizia un nuovo periodo per tracciare le spese del budget.
                      </AlertDescription>
                    </Alert>
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
