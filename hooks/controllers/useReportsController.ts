/**
 * Reports Controller Hook
 * Extracts ALL business logic from reports/page.tsx
 * Follows MVC pattern established in useTransactionsController
 *
 * Responsibilities:
 * 1. Data fetching (transactions)
 * 2. Financial calculations (income, expenses, savings, category breakdown)
 * 3. Report aggregation (monthly, yearly)
 * 4. Action handlers (navigation)
 */

'use client';

import { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTransactions, useUserSelection } from '@/hooks';

/**
 * Category data for expense breakdown
 */
interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
}

/**
 * Financial data for reports
 */
interface FinancialData {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  categoryData: CategoryData[];
  yearSavings: number;
  savingsGoal: number;
  savingsProgress: number;
}

export function useReportsController() {
  const router = useRouter();

  // ========================================
  // DATA FETCHING
  // ========================================
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();

  const {
    currentUser,
    selectedViewUserId,
    users,
    updateViewUserId,
    isLoading: userSelectionLoading
  } = useUserSelection();

  // ========================================
  // COMPUTED DATA
  // ========================================

  // Calculate financial data based on selected user/group filter
  const financialData: FinancialData | null = useMemo(() => {
    if (!currentUser) return null;

    // Filter transactions based on selected group filter
    const filteredTransactions = selectedViewUserId === 'all'
      ? transactions
      : transactions.filter(tx => tx.user_id === selectedViewUserId);

    // Calculate current month data
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const currentMonthTransactions = filteredTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });

    const totalIncome = currentMonthTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalExpenses = currentMonthTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const netSavings = totalIncome - totalExpenses;

    // Calculate expenses by category
    const expensesByCategory = currentMonthTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>);

    // Convert to array and sort by amount
    const categoryData: CategoryData[] = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 categories

    // Calculate annual savings progress
    const yearStart = new Date(currentYear, 0, 1);
    const yearTransactions = filteredTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= yearStart;
    });

    const yearIncome = yearTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const yearExpenses = yearTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const yearSavings = yearIncome - yearExpenses;
    const savingsGoal = 15000; // This could come from user preferences
    const savingsProgress = Math.min((yearSavings / savingsGoal) * 100, 100);

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      categoryData,
      yearSavings,
      savingsGoal,
      savingsProgress
    };
  }, [currentUser, transactions, selectedViewUserId]);

  // ========================================
  // LOADING STATE
  // ========================================
  const isLoading = userSelectionLoading || transactionsLoading;

  // ========================================
  // ACTION HANDLERS
  // ========================================

  const handleBackClick = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  // ========================================
  // RETURN API
  // ========================================
  return {
    // Raw Data
    currentUser,
    selectedViewUserId,
    users,

    // Computed Data
    financialData,

    // Loading State
    isLoading,

    // State Setters
    updateViewUserId,

    // Actions
    handleBackClick,
  };
}
