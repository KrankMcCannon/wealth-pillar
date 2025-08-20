import { useCallback, useMemo, useState } from 'react';
import { Account, Budget, InvestmentHolding } from '../../types';
import { useFinance } from '../core/useFinance';

/**
 * Enum per i tipi di report
 */
export enum ReportType {
  INCOME_EXPENSES = 'income_expenses',
  BUDGET_ANALYSIS = 'budget_analysis',
  ACCOUNT_SUMMARY = 'account_summary',
  INVESTMENT_PERFORMANCE = 'investment_performance',
  CATEGORY_BREAKDOWN = 'category_breakdown',
  YEARLY_TRENDS = 'yearly_trends'
}

/**
 * Interface per i filtri dei report
 */
interface ReportFilters {
  selectedYear: number;
  selectedQuarter?: number;
  selectedMonth?: number;
  dateRange?: { start: string; end: string };
  personIds: string[];
  accountIds: string[];
  categories: string[];
}

/**
 * Interface per i dati del report
 */
interface ReportData {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    accountsBalance: number;
    investmentsValue: number;
    budgetUtilization: number;
  };
  monthlyData: {
    month: string;
    income: number;
    expenses: number;
    net: number;
  }[];
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
    transactions: number;
  }[];
  accountSummary: {
    account: Account;
    balance: number;
    transactions: number;
    lastTransaction?: Date;
  }[];
  budgetAnalysis: {
    budget: Budget;
    allocated: number;
    spent: number;
    remaining: number;
    utilization: number;
  }[];
  investmentSummary?: {
    totalValue: number;
    totalCost: number;
    totalGainLoss: number;
    totalReturn: number;
    holdings: {
      investment: InvestmentHolding;
      value: number;
      gainLoss: number;
      returnPercent: number;
    }[];
  };
}

/**
 * Hook consolidato per tutti i report e analytics
 * Principio SRP: Single Responsibility - gestisce report e analisi
 * Principio DRY: Don't Repeat Yourself - unifica logica di reporting
 */
export const useReports = () => {
  const { 
    transactions, 
    accounts, 
    budgets, 
    investments, 
    getAccountById 
  } = useFinance();

  // === STATE MANAGEMENT ===

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filters, setFilters] = useState<ReportFilters>({
    selectedYear,
    personIds: [],
    accountIds: [],
    categories: [],
  });

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach(t => {
      years.add(new Date(t.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const updateFilters = useCallback((updates: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  // === DATA FILTERING ===

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const date = new Date(transaction.date);
      const year = date.getFullYear();
      
      // Year filter
      if (year !== filters.selectedYear) return false;
      
      // Month filter
      if (filters.selectedMonth && date.getMonth() + 1 !== filters.selectedMonth) return false;
      
      // Quarter filter
      if (filters.selectedQuarter) {
        const quarter = Math.ceil((date.getMonth() + 1) / 3);
        if (quarter !== filters.selectedQuarter) return false;
      }
      
      // Date range filter
      if (filters.dateRange) {
        const start = new Date(filters.dateRange.start);
        const end = new Date(filters.dateRange.end);
        if (date < start || date > end) return false;
      }
      
      // Person filter
      if (filters.personIds.length > 0) {
        const account = getAccountById(transaction.accountId);
        const belongsToSelectedPerson = account?.personIds.some(pid => 
          filters.personIds.includes(pid)
        );
        if (!belongsToSelectedPerson) return false;
      }
      
      // Account filter
      if (filters.accountIds.length > 0 && !filters.accountIds.includes(transaction.accountId)) {
        return false;
      }
      
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(transaction.category)) {
        return false;
      }
      
      return true;
    });
  }, [transactions, filters, getAccountById]);

  // === REPORT CALCULATIONS ===

  const reportData = useMemo((): ReportData => {
    const income = filteredTransactions.filter(t => t.type === 'entrata');
    const expenses = filteredTransactions.filter(t => t.type === 'spesa');

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const netIncome = totalIncome - totalExpenses;

    // Monthly breakdown
    const monthlyMap = new Map<string, { income: number; expenses: number }>();
    for (let month = 1; month <= 12; month++) {
      const key = new Date(filters.selectedYear, month - 1).toLocaleDateString('it-IT', { 
        month: 'long' 
      });
      monthlyMap.set(key, { income: 0, expenses: 0 });
    }

    filteredTransactions.forEach(transaction => {
      const month = new Date(transaction.date).toLocaleDateString('it-IT', { 
        month: 'long' 
      });
      const monthData = monthlyMap.get(month);
      if (monthData) {
        if (transaction.type === 'entrata') {
          monthData.income += transaction.amount;
        } else if (transaction.type === 'spesa') {
          monthData.expenses += Math.abs(transaction.amount);
        }
      }
    });

    const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    }));

    // Category breakdown
    const categoryMap = new Map<string, { amount: number; count: number }>();
    expenses.forEach(transaction => {
      const existing = categoryMap.get(transaction.category) || { amount: 0, count: 0 };
      categoryMap.set(transaction.category, {
        amount: existing.amount + Math.abs(transaction.amount),
        count: existing.count + 1,
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        transactions: data.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Account summary
    const accountSummary = accounts.map(account => {
      const accountTransactions = filteredTransactions.filter(t => 
        t.accountId === account.id || t.toAccountId === account.id
      );
      const lastTransaction = accountTransactions.length > 0 
        ? new Date(Math.max(...accountTransactions.map(t => new Date(t.date).getTime())))
        : undefined;

      return {
        account,
        balance: account.balance,
        transactions: accountTransactions.length,
        lastTransaction,
      };
    });

    // Budget analysis
    const budgetAnalysis = budgets.map(budget => {
      const budgetExpenses = expenses.filter(t => budget.categories.includes(t.category));
      const spent = budgetExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const remaining = budget.amount - spent;
      const utilization = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        budget,
        allocated: budget.amount,
        spent,
        remaining,
        utilization,
      };
    });

    // Investment summary (if investments exist)
    let investmentSummary;
    if (investments.length > 0) {
      const holdings = investments.map(investment => {
        const value = investment.quantity * investment.currentPrice;
        const cost = investment.quantity * investment.purchasePrice;
        const gainLoss = value - cost;
        const returnPercent = cost > 0 ? (gainLoss / cost) * 100 : 0;

        return {
          investment,
          value,
          gainLoss,
          returnPercent,
        };
      });

      const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
      const totalCost = holdings.reduce((sum, h) => sum + (h.investment.quantity * h.investment.purchasePrice), 0);
      const totalGainLoss = totalValue - totalCost;
      const totalReturn = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

      investmentSummary = {
        totalValue,
        totalCost,
        totalGainLoss,
        totalReturn,
        holdings,
      };
    }

    const accountsBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const investmentsValue = investmentSummary?.totalValue || 0;
    const budgetUtilization = budgets.length > 0 
      ? budgetAnalysis.reduce((sum, b) => sum + b.utilization, 0) / budgets.length
      : 0;

    return {
      summary: {
        totalIncome,
        totalExpenses,
        netIncome,
        accountsBalance,
        investmentsValue,
        budgetUtilization,
      },
      monthlyData,
      categoryBreakdown,
      accountSummary,
      budgetAnalysis,
      investmentSummary,
    };
  }, [filteredTransactions, accounts, budgets, investments, filters.selectedYear]);

  // === BUDGET HISTORY ===

  const budgetHistory = useMemo(() => {
    const history = new Map<string, { month: string; budgets: any[] }>();
    
    for (let month = 1; month <= 12; month++) {
      const monthKey = new Date(filters.selectedYear, month - 1).toLocaleDateString('it-IT', { 
        month: 'long' 
      });
      
      const monthBudgets = budgets.map(budget => {
        const monthTransactions = transactions.filter(t => {
          const date = new Date(t.date);
          return date.getFullYear() === filters.selectedYear &&
                 date.getMonth() + 1 === month &&
                 t.type === 'spesa' &&
                 budget.categories.includes(t.category);
        });

        const spent = monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const utilization = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        return {
          ...budget,
          spent,
          remaining: budget.amount - spent,
          utilization,
          transactionCount: monthTransactions.length,
        };
      });

      history.set(monthKey, {
        month: monthKey,
        budgets: monthBudgets,
      });
    }

    return Array.from(history.values());
  }, [budgets, transactions, filters.selectedYear]);

  // === YEARLY COMPARISON ===

  const yearlyComparison = useMemo(() => {
    const years = availableYears.slice(0, 3); // Last 3 years
    
    return years.map(year => {
      const yearTransactions = transactions.filter(t => 
        new Date(t.date).getFullYear() === year
      );
      
      const yearIncome = yearTransactions
        .filter(t => t.type === 'entrata')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const yearExpenses = yearTransactions
        .filter(t => t.type === 'spesa')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return {
        year,
        income: yearIncome,
        expenses: yearExpenses,
        net: yearIncome - yearExpenses,
        transactionCount: yearTransactions.length,
      };
    });
  }, [availableYears, transactions]);

  // === UTILITY FUNCTIONS ===

  const exportReportData = useCallback((reportType: ReportType, format: 'json' | 'csv' = 'json') => {
    let dataToExport: any;

    switch (reportType) {
      case ReportType.INCOME_EXPENSES:
        dataToExport = {
          summary: reportData.summary,
          monthlyData: reportData.monthlyData,
        };
        break;
      case ReportType.CATEGORY_BREAKDOWN:
        dataToExport = reportData.categoryBreakdown;
        break;
      case ReportType.BUDGET_ANALYSIS:
        dataToExport = reportData.budgetAnalysis;
        break;
      case ReportType.ACCOUNT_SUMMARY:
        dataToExport = reportData.accountSummary;
        break;
      case ReportType.INVESTMENT_PERFORMANCE:
        dataToExport = reportData.investmentSummary;
        break;
      case ReportType.YEARLY_TRENDS:
        dataToExport = yearlyComparison;
        break;
      default:
        dataToExport = reportData;
    }

    if (format === 'json') {
      return JSON.stringify(dataToExport, null, 2);
    } else {
      // Convert to CSV format
      // This is a simplified CSV conversion - could be enhanced
      return 'CSV export not implemented yet';
    }
  }, [reportData, yearlyComparison]);

  const getReportTitle = useCallback((reportType: ReportType): string => {
    const baseTitle = {
      [ReportType.INCOME_EXPENSES]: 'Entrate e Spese',
      [ReportType.BUDGET_ANALYSIS]: 'Analisi Budget',
      [ReportType.ACCOUNT_SUMMARY]: 'Riassunto Conti',
      [ReportType.INVESTMENT_PERFORMANCE]: 'Performance Investimenti',
      [ReportType.CATEGORY_BREAKDOWN]: 'Ripartizione per Categoria',
      [ReportType.YEARLY_TRENDS]: 'Tendenze Annuali',
    }[reportType];

    return `${baseTitle} - ${filters.selectedYear}`;
  }, [filters.selectedYear]);

  return {
    // Data
    reportData,
    budgetHistory,
    yearlyComparison,
    filteredTransactions,
    
    // Filters
    filters,
    updateFilters,
    availableYears,
    selectedYear,
    setSelectedYear,
    
    // Utilities
    exportReportData,
    getReportTitle,
    
    // Constants
    ReportType,
  };
};
