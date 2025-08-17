import { memo, useMemo } from "react";
import { Budget, Transaction } from "../../types";
import { formatCurrency, formatDate } from "../../constants";
import { ChevronDownIcon, ChevronUpIcon } from "../common/Icons";
import { CategoryUtils } from "../../lib/utils/category.utils";
import { useFinance } from "../../hooks";

interface BudgetCardProps {
  budget: Budget;
  data: {
    currentSpent: number;
    percentage: number;
    remaining: number;
    periodStart: Date;
    periodEnd: Date;
    progressColor: string;
    isCompleted: boolean;
  };
  transactions: Transaction[];
  categories: string[];
  isExpanded: boolean;
  onToggleExpansion: () => void;
}

/**
 * Componente riutilizzabile per una singola card di budget
 * Gestisce solo la visualizzazione, senza logica di business
 */
export const BudgetCard = memo<BudgetCardProps>(
  ({ budget, data, transactions, categories, isExpanded, onToggleExpansion }) => {
    const { categories: allCategories } = useFinance();

    // Calcola le statistiche per categoria
    const categoryStats = useMemo(() => {
      const stats = new Map<string, { count: number; total: number }>();

      transactions.forEach((tx) => {
        if (tx.category && categories.includes(tx.category)) {
          const current = stats.get(tx.category) || { count: 0, total: 0 };
          current.count += 1;
          current.total += Math.abs(tx.amount);
          stats.set(tx.category, current);
        }
      });

      return Array.from(stats.entries())
        .map(([category, stats]) => ({
          category,
          count: stats.count,
          total: stats.total,
        }))
        .sort((a, b) => b.total - a.total);
    }, [transactions, categories]);

    // Converti i name delle categorie in label per la visualizzazione
    const categoryLabels = useMemo(() => {
      return categories.map((category) => CategoryUtils.getCategoryDisplayName(category, allCategories));
    }, [categories, allCategories]);

    // Funzione per determinare il colore dell'importo basato sul progresso
    const getAmountColor = (amount: number, isRemaining: boolean = false) => {
      if (data.percentage >= 100) {
        return isRemaining ? "text-red-600 dark:text-red-400" : "text-red-600 dark:text-red-400";
      } else if (data.percentage >= 80) {
        return isRemaining ? "text-orange-600 dark:text-orange-400" : "text-orange-600 dark:text-orange-400";
      } else if (data.percentage >= 60) {
        return isRemaining ? "text-yellow-600 dark:text-yellow-400" : "text-yellow-600 dark:text-yellow-400";
      } else {
        return isRemaining ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400";
      }
    };

    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200 p-4 ${
          isExpanded
            ? "border-blue-300 dark:border-blue-600 shadow-md"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
        }`}
      >
        {/* Header della card */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-gray-800 dark:text-white">{budget.description}</h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Categorie: {categoryLabels.join(", ")}</div>
            {/* Date del periodo budget */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Periodo: {formatDate(data.periodStart.toISOString())} - {formatDate(data.periodEnd.toISOString())}
            </div>
          </div>
        </div>

        {/* Barra di progresso */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className={getAmountColor(data.currentSpent)}>Speso: {formatCurrency(data.currentSpent)}</span>
            <span className={getAmountColor(data.remaining, true)}>Rimanente: {formatCurrency(data.remaining)}</span>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${data.progressColor}`}
              style={{ width: `${Math.min(data.percentage, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">Budget: {formatCurrency(budget.amount)}</span>
            <span className={`font-medium ${getAmountColor(data.percentage)}`}>{data.percentage.toFixed(1)}%</span>
          </div>
        </div>

        {/* Stato completamento */}
        {data.isCompleted && (
          <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-3">✅ Periodo completato</div>
        )}

        {/* Pulsante per espandere/contrarre dettagli */}
        <div className="flex justify-center">
          <button
            onClick={onToggleExpansion}
            className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <span>{isExpanded ? "Nascondi dettagli" : "Mostra dettagli"}</span>
            {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </button>
        </div>

        {/* Dettagli espandibili */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Riepilogo dettagliato */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
              {/* Colonna sinistra: Statistiche per categoria */}
              <div>
                <h5 className="font-medium text-gray-800 dark:text-white mb-3 text-sm">
                  Spese per Categoria ({categoryStats.length})
                </h5>
                {categoryStats.length > 0 ? (
                  <div className="space-y-2">
                    {categoryStats.map(({ category, count, total }) => (
                      <div key={category} className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-700 dark:text-gray-300">
                            {CategoryUtils.getCategoryDisplayName(category, allCategories)}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            ({count} {count === 1 ? "transazione" : "transazioni"})
                          </span>
                        </div>
                        <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(total)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nessuna transazione trovata per le categorie di questo budget.
                  </p>
                )}
              </div>

              {/* Colonna destra: Lista transazioni */}
              <div>
                <h5 className="font-medium text-gray-800 dark:text-white mb-3 text-sm">
                  Transazioni ({transactions.length})
                </h5>
                {transactions.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-700 dark:text-gray-300 truncate">{tx.description}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(tx.date)} • {CategoryUtils.getCategoryDisplayName(tx.category, allCategories)}
                          </div>
                        </div>
                        <div className="ml-2 text-right">
                          <div className="font-medium text-red-600 dark:text-red-400">
                            -{formatCurrency(Math.abs(tx.amount))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nessuna transazione trovata per questo periodo.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

BudgetCard.displayName = "BudgetCard";
