import React, { useCallback, useEffect, useMemo } from "react";
import { useFinance, useModalForm } from "../../";
import { CategoryUtils } from "../../../lib/utils/category.utils";
import { TransactionFormValidator } from "../../../lib/utils/transaction-form-validator.utils";
import { Transaction, TransactionType } from "../../../types";

interface EditTransactionFormData {
  description: string;
  amount: string;
  date: string;
  type: TransactionType;
  category: string;
  accountId: string;
  toAccountId: string;
}

interface UseEditTransactionProps {
  transaction: Transaction;
  onClose: () => void;
}

/**
 * Hook per gestire la logica di editing delle transazioni
 * Estrae tutta la business logic dal componente UI
 */
export const useEditTransaction = ({ transaction, onClose }: UseEditTransactionProps) => {
  const { updateTransaction, accounts, categories, selectedPersonId, getCalculatedBalanceSync } = useFinance();

  const isAllView = selectedPersonId === "all";

  // Initial form data from transaction
  const initialFormData: EditTransactionFormData = useMemo(
    () => ({
      description: transaction.description,
      amount: transaction.amount.toString(),
      date: transaction.date.split("T")[0],
      type: transaction.type,
      category: transaction.category,
      accountId: transaction.accountId,
      toAccountId: transaction.toAccountId || "",
    }),
    [transaction]
  );

  const {
    data,
    errors,
    isSubmitting,
    updateField,
    setError,
    clearAllErrors,
    setSubmitting,
    resetForm,
    validateRequired,
  } = useModalForm({
    initialData: initialFormData,
    resetOnClose: false,
    resetOnOpen: false,
  });

  // Reset form data when transaction changes
  useEffect(() => {
    if (transaction) {
      resetForm();
    }
  }, [transaction, resetForm]);

  // Computed values
  const filteredAccounts = useMemo(() => {
    if (isAllView) {
      return accounts;
    }
    return accounts.filter((account) => account.personIds.includes(selectedPersonId));
  }, [accounts, selectedPersonId, isAllView]);

  // Memoized computed values
  const isTransfer = useMemo(() => CategoryUtils.isTransfer({ category: data.category } as any), [data.category]);

  const categoryOptions = useMemo(() => CategoryUtils.toSelectOptions(categories), [categories]);

  const accountOptions = useMemo(
    () =>
      filteredAccounts
        .map((acc) => ({
          value: acc.id,
          label: acc.name,
          balance: getCalculatedBalanceSync(acc.id),
        }))
        .sort((a, b) => b.balance - a.balance) // Ordina dal maggiore al minore
        .map(({ value, label }) => ({ value, label })),
    [filteredAccounts, getCalculatedBalanceSync]
  );

  const transferAccountOptions = useMemo(
    () =>
      filteredAccounts
        .filter((acc) => acc.id !== data.accountId)
        .map((acc) => ({
          value: acc.id,
          label: acc.name,
          balance: getCalculatedBalanceSync(acc.id),
        }))
        .sort((a, b) => b.balance - a.balance) // Ordina dal maggiore al minore
        .map(({ value, label }) => ({ value, label })),
    [filteredAccounts, data.accountId, getCalculatedBalanceSync]
  );

  const typeOptions = useMemo(
    () => [
      { value: TransactionType.ENTRATA, label: "Entrata" },
      { value: TransactionType.SPESA, label: "Spesa" },
    ],
    []
  );

  const showToAccount = isTransfer;

  // Validation
  const validateForm = useCallback((): boolean => {
    return TransactionFormValidator.validateTransactionForm(data, isTransfer, {
      setError,
      validateRequired,
      clearAllErrors,
    });
  }, [data, isTransfer, clearAllErrors, setError, validateRequired]);

  // Submit handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setSubmitting(true);

      try {
        const updatedTransaction: Transaction = {
          ...transaction,
          description: data.description.trim(),
          amount: parseFloat(data.amount),
          date: data.date,
          type: data.type,
          category: data.category,
          accountId: data.accountId,
          toAccountId: data.toAccountId || null,
        };

        await updateTransaction(updatedTransaction);
        onClose();
      } catch (error) {
        console.error("Failed to update transaction:", error);
        setError("general", "Errore nel salvataggio. Riprova.");
      } finally {
        setSubmitting(false);
      }
    },
    [validateForm, setSubmitting, data, transaction, updateTransaction, onClose, setError]
  );

  // Field change handlers
  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField("description", e.target.value);
    },
    [updateField]
  );

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField("amount", e.target.value);
    },
    [updateField]
  );

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField("date", e.target.value);
    },
    [updateField]
  );

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value as TransactionType;
      updateField("type", newType);

      // Reset category when type changes
      updateField("category", "");
    },
    [updateField]
  );

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateField("category", e.target.value);
    },
    [updateField]
  );

  const handleAccountChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateField("accountId", e.target.value);
    },
    [updateField]
  );

  const handleToAccountChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateField("toAccountId", e.target.value);
    },
    [updateField]
  );

  // Check if form can be submitted
  const canSubmit = useMemo(() => {
    return (
      data.description.trim().length > 0 &&
      data.amount.trim().length > 0 &&
      parseFloat(data.amount) > 0 &&
      data.accountId.length > 0 &&
      (!isTransfer || data.toAccountId.length > 0) &&
      data.category.length > 0
    );
  }, [data, isTransfer]);

  return {
    // Form state
    data,
    errors,
    isSubmitting,
    canSubmit,

    // Computed values
    accountOptions,
    categoryOptions,
    transferAccountOptions,
    typeOptions,
    showToAccount,
    isTransfer,

    // Event handlers
    handleSubmit,
    handleDescriptionChange,
    handleAmountChange,
    handleDateChange,
    handleTypeChange,
    handleCategoryChange,
    handleAccountChange,
    handleToAccountChange,
  };
};
