import { Budget, Transaction, User } from "../types";

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Data non valida';
    }
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return 'Data non valida';
  }
}

export const formatDateLabel = (date: string): string => {
  try {
    const transactionDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (transactionDate.toDateString() === today.toDateString()) {
      return 'Oggi';
    } else if (transactionDate.toDateString() === yesterday.toDateString()) {
      return 'Ieri';
    } else {
      return formatDate(date);
    }
  } catch {
    return formatDate(date);
  }
};

export const calculateBalance = (transactions: Transaction[]): number => {
  // User-level balance: income - expense; ignore transfers (net zero across accounts)
  const balance = transactions.reduce((total, tx) => {
    if (tx.type === 'income') return total + tx.amount;
    if (tx.type === 'expense') return total - tx.amount;
    if (tx.type === 'transfer') return total - tx.amount;
    // transfer ignored at user level
    return total;
  }, 0);
  return Math.round(balance * 100) / 100;
};

export const isValidTransaction = (tx: Transaction): boolean => {
  return tx.amount !== null && tx.account_id !== "" && !isNaN(new Date(tx.date).getTime());
};

// Centralized account balance calculation with transfer handling
export const calculateAccountBalance = (accountId: string, transactions: Transaction[]): number => {
  const related = transactions.filter(t =>
    (t.account_id === accountId || t.to_account_id === accountId) &&
    isValidTransaction(t)
  );

  const balance = related.reduce((sum, t) => {
    // Handle transfer transactions (both type='transfer' and category='trasferimento' with to_account_id)
    if (t.to_account_id && (t.type === 'transfer' || t.category === 'trasferimento')) {
      if (t.account_id === accountId) return sum - t.amount; // outflow from source account
      if (t.to_account_id === accountId) return sum + t.amount; // inflow to destination account
      return sum;
    }

    // Handle regular income/expense transactions (only for account_id, not to_account_id)
    if (t.account_id === accountId && !t.to_account_id) {
      if (t.type === 'income') return sum + t.amount;
      if (t.type === 'expense') return sum - t.amount;
    }

    return sum;
  }, 0);

  return Math.round(balance * 100) / 100;
};

// Italian pluralization helper
export const pluralize = (count: number, singular: string, plural: string): string => {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
};

export const truncateText = (text: string, maxLength = 20): string =>
  text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;

// Category labels mapping
export const categoryLabels: Record<string, string> = {
  'parrucchiere': 'Parrucchiere',
  'trasferimento': 'Trasferimento',
  'altro': 'Altro',
  'bonifico': 'Bonifico',
  'abbonamenti_tv': 'Abbonamenti TV',
  'veterinario': 'Veterinario',
  'bollo_auto': 'Bollo Auto',
  'contanti': 'Contanti',
  'cibo_fuori': 'Ristoranti',
  'investimenti': 'Investimenti',
  'yuup_thor': 'Yuup',
  'palestra': 'Palestra',
  'spesa': 'Spesa',
  'bolletta_acqua': 'Bolletta Acqua',
  'medicine_thor': 'Medicine',
  'bolletta_tari': 'Bolletta TARI',
  'medicine': 'Medicine',
  'ricarica_telefono': 'Ricarica Telefono',
  'regali': 'Regali',
  'bolletta_tim': 'Bolletta TIM',
  'estetista': 'Estetista',
  'tagliando_auto': 'Tagliando Auto',
  'stipendio': 'Stipendio',
  'vestiti': 'Vestiti',
  'visite_mediche': 'Visite Mediche',
  'risparmi': 'Risparmi',
  'skincare': 'Skincare',
  'haircare': 'Haircare',
  'taglio_thor': 'Taglio',
  'cibo_thor': 'Cibo',
  'eventi': 'Eventi',
  'rata_auto': 'Rata Auto',
  'bolletta_gas': 'Bolletta Gas',
  'bolletta_depuratore': 'Bolletta Depuratore',
  'analisi_mediche': 'Analisi Mediche',
  'bolletta_luce': 'Bolletta Luce',
  'abbonamenti_necessari': 'Abbonamenti',
  'cibo_asporto': 'Cibo Asporto',
  'benzina': 'Benzina',
  'assicurazione': 'Assicurazione'
};

export const getCategoryLabel = (categoryKey: string): string => {
  return categoryLabels[categoryKey] || categoryKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Get active period dates for a user
export const getActivePeriodDates = (user: User): { start: Date | null; end: Date | null } => {
  const activePeriod = user.budget_periods?.find(period => period.is_active);

  if (activePeriod) {
    const start = new Date(activePeriod.start_date);
    start.setHours(0, 0, 0, 0); // Normalize to start of day

    let end = null;
    if (activePeriod.end_date) {
      end = new Date(activePeriod.end_date);
      end.setHours(23, 59, 59, 999); // Normalize to end of day
    }

    return { start, end };
  }

  // Fallback: create period based on user's budget_start_date
  const now = new Date();
  const budgetStartDay = user.budget_start_date || 1;

  // Calculate current budget period based on user's start day
  let periodStart: Date;
  let periodEnd: Date;

  if (now.getDate() >= budgetStartDay) {
    // We're in the current month's budget period
    periodStart = new Date(now.getFullYear(), now.getMonth(), budgetStartDay);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, budgetStartDay - 1);
  } else {
    // We're in the previous month's budget period
    periodStart = new Date(now.getFullYear(), now.getMonth() - 1, budgetStartDay);
    periodEnd = new Date(now.getFullYear(), now.getMonth(), budgetStartDay - 1);
  }

  return {
    start: periodStart,
    end: periodEnd
  };
};

export const isWithinDateRange = (txDate: Date, startDate: Date, endDate?: Date): boolean => {
  // Normalize all dates to start of day for comparison
  const txDateNormalized = new Date(txDate);
  txDateNormalized.setHours(0, 0, 0, 0);

  const startDateNormalized = new Date(startDate);
  startDateNormalized.setHours(0, 0, 0, 0);

  if (!endDate) {
    // If no end date, only check if transaction is on or after start date
    return txDateNormalized >= startDateNormalized;
  }

  const endDateNormalized = new Date(endDate);
  endDateNormalized.setHours(23, 59, 59, 999); // End of day

  return txDateNormalized >= startDateNormalized && txDateNormalized <= endDateNormalized;
};

// Centralized budget transaction filtering
export const getBudgetTransactions = (
  transactions: Transaction[],
  budget: Budget,
  periodStart?: Date,
  periodEnd?: Date
): Transaction[] => {
  return transactions.filter(tx => {
    // Basic filtering
    if (!isValidTransaction(tx)) return false;
    if (tx.user_id !== budget.user_id) return false;
    if (!budget.categories.includes(tx.category)) return false;

    // Date filtering if period is specified
    if (periodStart) {
      const txDate = new Date(tx.date);
      return isWithinDateRange(txDate, periodStart, periodEnd);
    }

    return true;
  });
};

// Centralized budget spent calculation
export const calculateBudgetSpent = (
  transactions: Transaction[],
  budget: Budget,
  periodStart?: Date,
  periodEnd?: Date
): number => {
  const relevantTransactions = getBudgetTransactions(transactions, budget, periodStart, periodEnd);

  const spent = relevantTransactions.reduce((total, tx) => {
    if (tx.type === 'expense' || tx.type === 'transfer') return total + tx.amount;
    if (tx.type === 'income') return total - tx.amount;
    return total;
  }, 0);

  return Math.round(spent * 100) / 100;
};

/**
 * Calculates user's total financial metrics from all budget periods
 * Follows DRY principle - reusable across dashboard, budget page, and modal
 * Follows Single Responsibility Principle - only calculates financial totals
 *
 * @param user - User object with budget_periods
 * @param budgets - Array of user's budgets (optional, for current budget calculations)
 * @param transactions - Array of transactions (optional, for current period calculations)
 * @returns Object with totalSpent, totalSaved, and totalBudget
 */
export const calculateUserFinancialTotals = (
  user: User,
  budgets: Budget[] = [],
  transactions: Transaction[] = []
): {
  totalSpent: number;
  totalSaved: number;
  totalBudget: number;
  totalFromPeriods: number; // kept for backward compatibility; always 0 (no historical refs)
  totalFromBudgets: number;
} => {
  if (!user) {
    return {
      totalSpent: 0,
      totalSaved: 0,
      totalBudget: 0,
      totalFromPeriods: 0,
      totalFromBudgets: 0
    };
  }

  // Only consider CURRENT period data (no references to previous periods)
  const userBudgets = budgets.filter(budget => budget.user_id === user.id);
  const totalBudget = userBudgets.reduce((sum, budget) => sum + (budget.amount || 0), 0);

  const { start, end } = getActivePeriodDates(user);

  const totalFromBudgets = (transactions.length > 0 && userBudgets.length > 0)
    ? userBudgets.reduce((sum, budget) => {
        const spent = calculateBudgetSpent(
          transactions,
          budget,
          start || undefined,
          end || undefined
        );
        return sum + spent;
      }, 0)
    : 0;

  // Saved = available (budget total) - spent
  const totalSpent = totalFromBudgets;
  const totalSaved = Math.max(0, Math.round((totalBudget - totalFromBudgets) * 100) / 100);

  return {
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalSaved,
    totalBudget: Math.round(totalBudget * 100) / 100,
    totalFromPeriods: 0,
    totalFromBudgets: Math.round(totalFromBudgets * 100) / 100,
  };
};