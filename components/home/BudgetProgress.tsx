import { memo, useState } from "react";
import type { Budget, Person, BudgetPeriodData } from "../../types";
import { BudgetPeriodButton } from "../budget/BudgetPeriodButton";
import { BudgetList } from "../budget/BudgetList";
import { BudgetPeriodSelector } from "../budget/BudgetPeriodSelector";
import { useBudgets } from "../../hooks";

/**
 * Props per BudgetProgress
 */
interface BudgetProgressProps {
  budgets: Budget[];
  people: Person[];
  selectedPersonId?: string;
  isReportMode?: boolean;
  availablePeriods?: BudgetPeriodData[];
  selectedPeriod?: BudgetPeriodData;
  onPeriodChange?: (period: BudgetPeriodData) => void;
}

/**
 * Componente semplificato per visualizzare budget
 * Utilizza componenti riutilizzabili e hooks ottimizzati
 */
export const BudgetProgress = memo<BudgetProgressProps>(
  ({
    people,
    selectedPersonId,
    isReportMode = false,
    availablePeriods = [],
    selectedPeriod,
    onPeriodChange,
  }) => {
    const { budgets: budgetProgress } = useBudgets();
    const [expandedBudgets, setExpandedBudgets] = useState<Set<string>>(new Set());
    
    const toggleBudgetExpansion = (budgetId: string) => {
      setExpandedBudgets(prev => {
        const newSet = new Set(prev);
        if (newSet.has(budgetId)) {
          newSet.delete(budgetId);
        } else {
          newSet.add(budgetId);
        }
        return newSet;
      });
    };

    if (budgetProgress.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Nessun budget trovato.</p>
        </div>
      );
    }

    if (isReportMode && !selectedPeriod) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Seleziona un periodo per visualizzare i dati del budget.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 sm:space-y-6 overflow-hidden">
        {/* Header con controlli */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
              Budget Progress
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
              Monitoraggio spese e progresso budget
            </p>
          </div>

          {/* Pulsante gestione periodi (solo se non in modalità report) */}
          {!isReportMode && (
            <div className="flex-shrink-0">
              <BudgetPeriodButton people={people} />
            </div>
          )}
        </div>

        {/* Selettore periodi (solo in modalità report) */}
        {isReportMode && onPeriodChange && (
          <BudgetPeriodSelector
            availablePeriods={availablePeriods}
            selectedPeriod={selectedPeriod}
            onPeriodChange={onPeriodChange}
            isAllView={selectedPersonId === "all"}
          />
        )}

        {/* Lista budget */}
        <BudgetList
          budgets={budgetProgress}
          expandedBudgets={expandedBudgets}
          onToggleBudgetExpansion={toggleBudgetExpansion}
        />
      </div>
    );
  }
);

BudgetProgress.displayName = "BudgetProgress";
