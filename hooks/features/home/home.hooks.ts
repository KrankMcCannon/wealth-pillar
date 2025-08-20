import { useMemo, useState, useEffect, useCallback } from "react";
import { useFinance } from "../../core/useFinance";
import { Transaction, TransactionType, Account } from "../../../types";

// ---------------- Expense Chart ----------------
interface UseExpenseChartProps {
  transactions: Transaction[];
}

export const useExpenseChart = ({ transactions }: UseExpenseChartProps) => {
  const { getCategoryName, getEffectiveTransactionAmount } = useFinance();

  const expenseData = useMemo(() => {
    const expenseTransactions = transactions.filter((t) => t.type === TransactionType.SPESA);
    if (expenseTransactions.length === 0) return [] as Array<{ name: string; value: number }>;

    const categoryTotals = expenseTransactions.reduce((acc, transaction) => {
      const categoryName = getCategoryName(transaction.category);
      const amount = getEffectiveTransactionAmount(transaction);

      if (categoryName === "Altro" || categoryName === "Trasferimento") return acc;
      acc[categoryName] = (acc[categoryName] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [transactions, getCategoryName, getEffectiveTransactionAmount]);

  const totalExpenses = useMemo(() => expenseData.reduce((sum, item) => sum + item.value, 0), [expenseData]);
  const hasExpenses = expenseData.length > 0;

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

  return { expenseData, totalExpenses, hasExpenses, COLORS };
};

// ---------------- Home Data ----------------
export const useHomeData = () => {
  const {
    people,
    accounts,
    transactions,
    budgets,
    getAccountById,
    selectedPersonId,
    getPersonById,
    getCalculatedBalanceSync,
  } = useFinance();

  const homeData = useMemo(() => {
    const isAllView = selectedPersonId === "all";
    const selectedPerson = people.find((p) => p.id === selectedPersonId);

    const displayedAccounts = isAllView ? accounts : accounts.filter((acc) => acc.personIds.includes(selectedPersonId));
    const displayedBudgets = isAllView ? budgets : budgets.filter((b) => b.personId === selectedPersonId);
    const displayedTransactions = isAllView
      ? transactions
      : transactions.filter((t) => {
          const account = getAccountById(t.accountId);
          return account?.personIds.includes(selectedPersonId);
        });

    // Recent 5 transactions without TransactionUtils
    const recentTransactions = [...displayedTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return { isAllView, selectedPerson, displayedAccounts, displayedBudgets, displayedTransactions, recentTransactions };
  }, [selectedPersonId, people, accounts, budgets, transactions, getAccountById]);

  const accountsWithData = useMemo(() => {
    return homeData.displayedAccounts
      .map((acc) => {
        const personNames = homeData.isAllView
          ? acc.personIds.map((id) => getPersonById(id)?.name).filter(Boolean).join(", ")
          : undefined;
        const calculatedBalance = getCalculatedBalanceSync(acc.id);
        return { account: acc, balance: calculatedBalance, personName: personNames };
      })
      .sort((a, b) => b.balance - a.balance);
  }, [homeData.displayedAccounts, homeData.isAllView, getPersonById, getCalculatedBalanceSync]);

  const budgetsWithData = useMemo(() => {
    return homeData.displayedBudgets.map((budget) => {
      const budgetPerson = getPersonById(budget.personId);
      return { budget, person: budgetPerson || homeData.selectedPerson! };
    });
  }, [homeData.displayedBudgets, getPersonById, homeData.selectedPerson]);

  const recentTransactionsWithData = useMemo(() => {
    return homeData.recentTransactions.map((transaction) => {
      const account = getAccountById(transaction.accountId);
      const accountName = account ? account.name : "Conto sconosciuto";
      let personName: string | undefined;
      if (homeData.isAllView && account) {
        const transactionPerson = account.personIds.map((id) => getPersonById(id)).filter(Boolean)[0];
        personName = transactionPerson?.name;
      }
      return { transaction, accountName, personName };
    });
  }, [homeData.recentTransactions, homeData.isAllView, getAccountById, getPersonById]);

  return { ...homeData, accountsWithData, budgetsWithData, recentTransactionsWithData };
};

// ---------------- Account Ordering ----------------
interface AccountWithData { account: Account; balance: number; personName?: string }

export const useAccountOrdering = (accountsWithData: AccountWithData[]) => {
  const [orderedAccounts, setOrderedAccounts] = useState<AccountWithData[]>(accountsWithData);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  const [tempOrderedAccounts, setTempOrderedAccounts] = useState<AccountWithData[]>(accountsWithData);

  const saveOrder = useCallback((accounts: AccountWithData[]) => {
    try {
      const accountIds = accounts.map((acc) => acc.account.id);
      localStorage.setItem("accountCardOrder", JSON.stringify(accountIds));
    } catch (error) {
      console.error("Errore nel salvataggio dell'ordine:", error);
    }
  }, []);

  useEffect(() => {
    const savedOrder = localStorage.getItem("accountCardOrder");
    if (savedOrder) {
      try {
        const savedAccountIds = JSON.parse(savedOrder) as string[];
        const ordered = [...accountsWithData].sort((a, b) => {
          const aIndex = savedAccountIds.indexOf(a.account.id);
          const bIndex = savedAccountIds.indexOf(b.account.id);
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          return 0;
        });
        setOrderedAccounts(ordered);
        setTempOrderedAccounts(ordered);
      } catch (error) {
        console.error("Errore nel caricamento dell'ordine delle account:", error);
        setOrderedAccounts(accountsWithData);
        setTempOrderedAccounts(accountsWithData);
      }
    } else {
      setOrderedAccounts(accountsWithData);
      setTempOrderedAccounts(accountsWithData);
    }
  }, [accountsWithData]);

  useEffect(() => {
    if (draggedIndex === null && dragOverIndex === null) {
      setTempOrderedAccounts(orderedAccounts);
    }
  }, [orderedAccounts, draggedIndex, dragOverIndex]);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
    setDragOverIndex(null);
    setShowSuccessFeedback(false);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== index) {
        setDragOverIndex(index);
        const currentTempOrder = tempOrderedAccounts;
        const draggedItemIndex = currentTempOrder.findIndex((item) => item.account.id === orderedAccounts[draggedIndex].account.id);
        if (draggedItemIndex !== index && draggedItemIndex !== -1) {
          const newTempOrder = [...currentTempOrder];
          const [draggedItem] = newTempOrder.splice(draggedItemIndex, 1);
          newTempOrder.splice(index, 0, draggedItem);
          setTempOrderedAccounts(newTempOrder);
        }
      }
    },
    [draggedIndex, orderedAccounts, tempOrderedAccounts]
  );

  const handleDrop = useCallback(
    (draggedAccountId: string, toIndex: number) => {
      const currentOrder = tempOrderedAccounts;
      const fromIndex = currentOrder.findIndex((item) => item.account.id === draggedAccountId);
      if (fromIndex === -1) return;
      if (draggedIndex !== null) {
        const newOrder = [...currentOrder];
        const draggedItem = currentOrder[fromIndex];
        newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, draggedItem);
        setOrderedAccounts(newOrder);
        setTempOrderedAccounts(newOrder);
        saveOrder(newOrder);
        setDragOverIndex(null);
        setShowSuccessFeedback(true);
        setTimeout(() => setShowSuccessFeedback(false), 2000);
      }
    },
    [tempOrderedAccounts, draggedIndex, saveOrder]
  );

  return { orderedAccounts: tempOrderedAccounts, draggedIndex, dragOverIndex, showSuccessFeedback, handleDragStart, handleDragEnd, handleDragOver, handleDrop };
};

