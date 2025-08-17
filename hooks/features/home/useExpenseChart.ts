import { useMemo } from "react";
import { useFinance } from "../../";
import { Transaction, TransactionType } from "../../../types";

interface UseExpenseChartProps {
  transactions: Transaction[];
}

/**
 * Hook per gestire la logica di calcolo dei dati del grafico spese
 * Estrae la business logic dal componente UI
 */
export const useExpenseChart = ({ transactions }: UseExpenseChartProps) => {
  const { getCategoryName, getEffectiveTransactionAmount } = useFinance();

  // Memoized expense data calculation
  const expenseData = useMemo(() => {
    const expenseTransactions = transactions.filter((t) => t.type === TransactionType.SPESA);

    if (expenseTransactions.length === 0) return [];

    const categoryTotals = expenseTransactions.reduce((acc, transaction) => {
      const categoryName = getCategoryName(transaction.category);
      const amount = getEffectiveTransactionAmount(transaction);

      // Escludi le categorie "Altro" e "Trasferimento"
      if (categoryName === "Altro" || categoryName === "Trasferimento") {
        return acc;
      }

      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 categorie
  }, [transactions, getCategoryName, getEffectiveTransactionAmount]);

  const totalExpenses = useMemo(() => {
    return expenseData.reduce((sum, item) => sum + item.value, 0);
  }, [expenseData]);

  const hasExpenses = expenseData.length > 0;

  // Palette colori moderna e accessibile
  const COLORS = [
    "#6366F1",
    "#EC4899",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#06B6D4",
    "#EF4444",
    "#84CC16",
    "#F97316",
    "#14B8A6",
    "#3B82F6",
    "#F43F5E",
  ];

  return {
    expenseData,
    totalExpenses,
    hasExpenses,
    COLORS,
  };
};
