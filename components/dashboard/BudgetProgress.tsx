import React, { memo } from "react";
import type { Budget, Person, BudgetPeriodData } from "../../types";
import { BudgetPeriodButton } from "../budget/BudgetPeriodButton";
import { BudgetList } from "../budget/BudgetList";
import { BudgetPeriodSelector } from "../budget/BudgetPeriodSelector";
import { PeriodFilteringService } from "../../lib/services";
import { useBudgetProgress } from "../../hooks/features/budgets/useBudgetProgress";

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
    budgets,
    people,
    selectedPersonId,
    isReportMode = false,
    availablePeriods = [],
    selectedPeriod,
    onPeriodChange,
  }) => {
    const { selectedPersonData, hasData, expandedBudgets, toggleBudgetExpansion, dataToRender } = useBudgetProgress({
      budgets,
      selectedPersonId,
      isReportMode,
      selectedPeriod,
    });

    // Ottieni informazioni sul periodo e persona per la UI
    const periodDisplayInfo =
      isReportMode && selectedPeriod
        ? PeriodFilteringService.getPeriodDisplayInfo(selectedPeriod, people)
        : { personName: undefined, periodLabel: undefined };

    if (!hasData) {
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
      <div className="space-y-6">
        {/* Header con controlli */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isReportMode && periodDisplayInfo.personName
                ? `Budget di ${periodDisplayInfo.personName}`
                : selectedPersonId === "all"
                ? "Budget Globali"
                : selectedPersonData
                ? `Budget di ${selectedPersonData.person.name}`
                : "Budget"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isReportMode && periodDisplayInfo.periodLabel
                ? `Periodo: ${periodDisplayInfo.periodLabel}`
                : selectedPersonId === "all"
                ? "Monitoraggio spese e progresso budget per tutte le persone"
                : "Monitoraggio spese e progresso budget"}
            </p>
          </div>

          {/* Pulsante gestione periodi (solo se non in modalità report) */}
          {!isReportMode && <BudgetPeriodButton people={people} />}
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

        {/* Lista budget per persona */}
        {dataToRender.map((personData) => (
          <div key={personData.person.id} className="space-y-4">
            {/* Header persona */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
              <h4 className="font-medium text-gray-800 dark:text-white">
                {personData.person.name}
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  ({personData.budgets.length} budget)
                </span>
              </h4>
            </div>

            {/* Lista budget */}
            <BudgetList
              budgets={personData.budgets}
              expandedBudgets={expandedBudgets}
              onToggleBudgetExpansion={toggleBudgetExpansion}
            />
          </div>
        ))}
      </div>
    );
  }
);

BudgetProgress.displayName = "BudgetProgress";
