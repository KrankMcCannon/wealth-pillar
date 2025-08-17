import React, { memo } from "react";
import { BudgetPeriodData } from "../../types";
import { Card } from "../ui";

interface BudgetPeriodSelectorProps {
  availablePeriods: BudgetPeriodData[];
  selectedPeriod?: BudgetPeriodData;
  onPeriodChange: (period: BudgetPeriodData) => void;
  isAllView?: boolean;
}

/**
 * Componente per la selezione dei periodi di budget
 * Utilizzato nella pagina reports per filtrare i dati per periodo
 */
export const BudgetPeriodSelector = memo<BudgetPeriodSelectorProps>(
  ({ availablePeriods, selectedPeriod, onPeriodChange, isAllView = false }) => {
    if (availablePeriods.length === 0) {
      return (
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isAllView
                ? "Nessun periodo di budget disponibile per le persone del gruppo."
                : "Nessun periodo di budget configurato."}
            </p>
          </div>
        </Card>
      );
    }

    return (
      <Card>
        <div className="p-4">
          <label
            htmlFor="budget-period-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {isAllView ? "Periodo di Riferimento (Tutte le Persone)" : "Periodo di Riferimento"}
          </label>
          <select
            id="budget-period-select"
            value={selectedPeriod ? `${selectedPeriod.startDate}-${selectedPeriod.endDate || "ongoing"}` : ""}
            onChange={(e) => {
              // Fix parsing logic - the value format is: "YYYY-MM-DD-ongoing" or "YYYY-MM-DD-YYYY-MM-DD"
              const parts = e.target.value.split("-");
              let startDate: string;
              let endDate: string | undefined;

              if (parts.length === 4 && parts[3] === "ongoing") {
                // Format: "2025-07-25-ongoing"
                startDate = `${parts[0]}-${parts[1]}-${parts[2]}`;
                endDate = undefined;
              } else if (parts.length === 6) {
                // Format: "2025-07-25-2025-08-10"
                startDate = `${parts[0]}-${parts[1]}-${parts[2]}`;
                endDate = `${parts[3]}-${parts[4]}-${parts[5]}`;
              } else {
                return;
              }

              const period = availablePeriods.find((p) => p.startDate === startDate && p.endDate === endDate);

              if (period) {
                onPeriodChange(period);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {availablePeriods.map((period) => {
              const periodKey = `${period.startDate}-${period.endDate || "ongoing"}`;
              const startDate = new Date(period.startDate);
              const endDate = period.endDate ? new Date(period.endDate) : null;

              let label = `${startDate.toLocaleDateString("it-IT", { month: "short", year: "numeric" })}`;
              if (endDate) {
                label += ` - ${endDate.toLocaleDateString("it-IT", { month: "short", year: "numeric" })}`;
              } else {
                label += " - In corso";
              }

              if (period.isCompleted) {
                label += " (Completato)";
              }

              return (
                <option key={periodKey} value={periodKey}>
                  {label}
                </option>
              );
            })}
          </select>

          {selectedPeriod && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              <p>
                <span className="font-medium">Periodo selezionato:</span>{" "}
                {selectedPeriod.startDate
                  ? new Date(selectedPeriod.startDate).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Non specificato"}
                {selectedPeriod.endDate && (
                  <>
                    {" "}
                    -{" "}
                    {new Date(selectedPeriod.endDate).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </>
                )}
              </p>
              {selectedPeriod.isCompleted && (
                <p className="text-green-600 dark:text-green-400 font-medium">✓ Periodo completato</p>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }
);

BudgetPeriodSelector.displayName = "BudgetPeriodSelector";
