import { useCallback, useMemo, useState } from 'react';
import { Budget, Transaction } from '../../types';
import { useFinance } from '../core/useFinance';
import { useModalForm } from '../ui/useModalForm';
import { validateBudgetForm } from '../utils/validators';

/**
 * Enum per i periodi di budget
 */
export enum BudgetPeriod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

/**
 * Interface per lo stato del budget
 */
interface BudgetState {
  selectedPeriod: BudgetPeriod;
  selectedYear: number;
  selectedMonth: number;
  selectedQuarter: number;
  customStartDate: string;
  customEndDate: string;
  showCompleted: boolean;
  sortBy: 'name' | 'amount' | 'progress' | 'category';
  sortDirection: 'asc' | 'desc';
}

/**
 * Interface per il progresso del budget
 */
interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  isOverspent: boolean;
  transactions: Transaction[];
  daysInPeriod: number;
  daysRemaining: number;
  projectedSpend: number;
}

/**
 * Hook consolidato per gestire tutti gli aspetti dei budget
 * Principio SRP: Single Responsibility - gestisce budget
 * Principio DRY: Don't Repeat Yourself - unifica tutta la logica budget
 */
export const useBudgets = () => {
  const { budgets, transactions, addBudget, updateBudget, people } = useFinance();

  // === STATE MANAGEMENT ===

  const [budgetState, setBudgetState] = useState<BudgetState>({
    selectedPeriod: BudgetPeriod.MONTHLY,
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth() + 1,
    selectedQuarter: Math.ceil((new Date().getMonth() + 1) / 3),
    customStartDate: '',
    customEndDate: '',
    showCompleted: true,
    sortBy: 'name',
    sortDirection: 'asc',
  });

  const updateBudgetState = useCallback((updates: Partial<BudgetState>) => {
    setBudgetState(prev => ({ ...prev, ...updates }));
  }, []);

  // === PERIOD MANAGEMENT ===

  const getCurrentPeriodDates = useCallback(() => {
    const { selectedPeriod, selectedYear, selectedMonth, selectedQuarter, customStartDate, customEndDate } = budgetState;

    switch (selectedPeriod) {
      case BudgetPeriod.MONTHLY:
        const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
        const monthEnd = new Date(selectedYear, selectedMonth, 0);
        return { start: monthStart, end: monthEnd };

      case BudgetPeriod.QUARTERLY:
        const quarterStart = new Date(selectedYear, (selectedQuarter - 1) * 3, 1);
        const quarterEnd = new Date(selectedYear, selectedQuarter * 3, 0);
        return { start: quarterStart, end: quarterEnd };

      case BudgetPeriod.YEARLY:
        const yearStart = new Date(selectedYear, 0, 1);
        const yearEnd = new Date(selectedYear, 11, 31);
        return { start: yearStart, end: yearEnd };

      case BudgetPeriod.CUSTOM:
        return {
          start: new Date(customStartDate),
          end: new Date(customEndDate)
        };

      default:
        return { start: new Date(), end: new Date() };
    }
  }, [budgetState]);

  const periodDates = getCurrentPeriodDates();

  // === BUDGET CALCULATIONS ===

  const budgetProgress = useMemo((): BudgetProgress[] => {
    const progress = budgets.map(budget => {
      // Trova le transazioni che appartengono a questo budget nel periodo corrente
      const budgetTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        const isInPeriod = transactionDate >= periodDates.start && transactionDate <= periodDates.end;
        const isSpesa = transaction.type === 'spesa';
        const isCorrectCategory = budget.categories.includes(transaction.category);
        
        return isInPeriod && isSpesa && isCorrectCategory;
      });

      const spent = budgetTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const isOverspent = spent > budget.amount;

      // Calcola i giorni
      const now = new Date();
      const periodStart = periodDates.start;
      const periodEnd = periodDates.end;
      const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const daysElapsed = Math.max(0, Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
      const daysRemaining = Math.max(0, daysInPeriod - daysElapsed);

      // Proiezione di spesa
      const dailySpendRate = daysElapsed > 0 ? spent / daysElapsed : 0;
      const projectedSpend = dailySpendRate * daysInPeriod;

      return {
        budget,
        spent,
        remaining,
        percentage,
        isOverspent,
        transactions: budgetTransactions,
        daysInPeriod,
        daysRemaining,
        projectedSpend,
      };
    });

    // Applica filtri e ordinamento
    let filtered = progress;

    if (!budgetState.showCompleted) {
      filtered = filtered.filter(p => p.percentage < 100);
    }

    // Ordinamento
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (budgetState.sortBy) {
        case 'amount':
          comparison = a.budget.amount - b.budget.amount;
          break;
        case 'progress':
          comparison = a.percentage - b.percentage;
          break;
        case 'category':
          comparison = a.budget.categories[0].localeCompare(b.budget.categories[0]);
          break;
        case 'name':
        default:
          comparison = a.budget.description.localeCompare(b.budget.description);
          break;
      }

      return budgetState.sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [budgets, transactions, periodDates, budgetState]);

  // Statistiche globali
  const budgetStats = useMemo(() => {
    const totalBudget = budgetProgress.reduce((sum, p) => sum + p.budget.amount, 0);
    const totalSpent = budgetProgress.reduce((sum, p) => sum + p.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overbudgetCount = budgetProgress.filter(p => p.isOverspent).length;
    const completedCount = budgetProgress.filter(p => p.percentage >= 100).length;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      totalPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      overbudgetCount,
      completedCount,
      activeCount: budgetProgress.length - completedCount,
    };
  }, [budgetProgress]);

  // === FORM MANAGEMENT ===

  const budgetForm = useModalForm({
    initialData: {
      name: '',
      amount: 0,
      category: '',
      selectedPersonIds: [] as string[],
    },
    resetOnClose: true,
    resetOnOpen: true,
  });

  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const openBudgetForm = useCallback((budget?: Budget) => {
    if (budget) {
      budgetForm.updateData({
        name: budget.description,
        amount: budget.amount,
        category: budget.categories[0] || '',
        selectedPersonIds: [budget.personId],
      });
      setEditingBudget(budget);
    } else {
      budgetForm.resetForm();
      setEditingBudget(null);
    }
  }, [budgetForm]);

  const saveBudgetForm = useCallback(async (onClose: () => void) => {
    const errors = validateBudgetForm({
      description: budgetForm.data.name,
      amount: budgetForm.data.amount.toString(),
      selectedCategories: [budgetForm.data.category],
    });

    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => {
        budgetForm.setError(field, message);
      });
      return;
    }

    budgetForm.setSubmitting(true);

    try {
      const budgetData = {
        description: budgetForm.data.name.trim(),
        amount: budgetForm.data.amount,
        categories: [budgetForm.data.category],
        personId: budgetForm.data.selectedPersonIds[0],
        period: 'monthly' as const,
      };

      if (editingBudget) {
        await updateBudget({ ...editingBudget, ...budgetData });
      } else {
        await addBudget(budgetData);
      }

      onClose();
      setEditingBudget(null);
    } catch (err) {
      budgetForm.setError("general", err instanceof Error ? err.message : "Errore durante l'operazione");
    } finally {
      budgetForm.setSubmitting(false);
    }
  }, [budgetForm, editingBudget, addBudget, updateBudget]);

  const peopleOptions = useMemo(() => 
    people.map(person => ({
      id: person.id,
      label: person.name,
      checked: budgetForm.data.selectedPersonIds.includes(person.id),
    })),
    [people, budgetForm.data.selectedPersonIds]
  );

  const handlePersonToggle = useCallback((personId: string, checked: boolean) => {
    const currentIds = budgetForm.data.selectedPersonIds;
    const newSelectedIds = checked
      ? [...currentIds, personId]
      : currentIds.filter(id => id !== personId);

    budgetForm.updateField("selectedPersonIds", newSelectedIds);
  }, [budgetForm]);

  // === PERIOD NAVIGATION ===

  const navigatePeriod = useCallback((direction: 'prev' | 'next') => {
    const { selectedPeriod, selectedYear, selectedMonth, selectedQuarter } = budgetState;

    switch (selectedPeriod) {
      case BudgetPeriod.MONTHLY:
        const newMonth = direction === 'next' ? selectedMonth + 1 : selectedMonth - 1;
        if (newMonth > 12) {
          updateBudgetState({ selectedMonth: 1, selectedYear: selectedYear + 1 });
        } else if (newMonth < 1) {
          updateBudgetState({ selectedMonth: 12, selectedYear: selectedYear - 1 });
        } else {
          updateBudgetState({ selectedMonth: newMonth });
        }
        break;

      case BudgetPeriod.QUARTERLY:
        const newQuarter = direction === 'next' ? selectedQuarter + 1 : selectedQuarter - 1;
        if (newQuarter > 4) {
          updateBudgetState({ selectedQuarter: 1, selectedYear: selectedYear + 1 });
        } else if (newQuarter < 1) {
          updateBudgetState({ selectedQuarter: 4, selectedYear: selectedYear - 1 });
        } else {
          updateBudgetState({ selectedQuarter: newQuarter });
        }
        break;

      case BudgetPeriod.YEARLY:
        updateBudgetState({ 
          selectedYear: direction === 'next' ? selectedYear + 1 : selectedYear - 1 
        });
        break;
    }
  }, [budgetState, updateBudgetState]);

  // === UTILITY FUNCTIONS ===

  const getBudgetStatusColor = useCallback((progress: BudgetProgress): string => {
    if (progress.isOverspent) return 'red';
    if (progress.percentage >= 90) return 'orange';
    if (progress.percentage >= 75) return 'yellow';
    return 'green';
  }, []);

  const getPeriodLabel = useCallback(() => {
    const { selectedPeriod, selectedYear, selectedMonth, selectedQuarter } = budgetState;

    switch (selectedPeriod) {
      case BudgetPeriod.MONTHLY:
        return new Date(selectedYear, selectedMonth - 1).toLocaleDateString('it-IT', {
          year: 'numeric',
          month: 'long'
        });
      case BudgetPeriod.QUARTERLY:
        return `Q${selectedQuarter} ${selectedYear}`;
      case BudgetPeriod.YEARLY:
        return selectedYear.toString();
      case BudgetPeriod.CUSTOM:
        return `${budgetState.customStartDate} - ${budgetState.customEndDate}`;
      default:
        return '';
    }
  }, [budgetState]);

  const getUniqueCategories = useCallback(() => {
    return [...new Set(transactions.filter(t => t.type === 'spesa').map(t => t.category))];
  }, [transactions]);

  return {
    // Data
    budgets: budgetProgress,
    budgetStats,
    
    // State
    budgetState,
    updateBudgetState,
    
    // Period management
    periodDates,
    navigatePeriod,
    getPeriodLabel,
    
    // Form
    budgetForm,
    editingBudget,
    peopleOptions,
    openBudgetForm,
    saveBudgetForm,
    handlePersonToggle,
    
    // Utilities
    getBudgetStatusColor,
    getUniqueCategories,
    
    // Constants
    BudgetPeriod,
  };
};