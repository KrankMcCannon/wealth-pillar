"use client";

import { useAccounts, useUsers } from '@/src/lib';
import {
  createFormState,
  formatDateForForm,
  isDirty as isFormDirty,
  sanitizeFormState
} from "@/src/lib/services/form-state.service";
import {
  transactionValidationSchema,
  validateFieldByName,
  validateForm,
  validateTransferTransaction,
  type ValidationErrors,
} from "@/src/lib/services/form-validation.service";
import type { Transaction, TransactionFrequencyType, TransactionType } from "@/src/lib/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCreateTransaction, useUpdateTransaction } from "./use-transaction-mutations";

export type TransactionFormMode = "create" | "edit";

export interface TransactionFormState {
  description: string;
  amount: string; // keep as string for input UX, convert on submit
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  user_id: string;
  account_id: string;
  to_account_id?: string;
  frequency?: TransactionFrequencyType;
}

export interface UseTransactionFormControllerOptions {
  mode?: TransactionFormMode;
  initialType?: TransactionType;
  selectedUserId?: string;
  initialTransaction?: Transaction | null;
}

export interface UseTransactionFormControllerResult {
  form: TransactionFormState;
  errors: ValidationErrors<TransactionFormState>;
  isSubmitting: boolean;
  isDirty: boolean;
  setField: <K extends keyof TransactionFormState>(key: K, value: TransactionFormState[K]) => void;
  validateField: (key: keyof TransactionFormState) => void;
  reset: () => void;
  submit: () => Promise<void>;
}

const defaultState: TransactionFormState = {
  description: "",
  amount: "",
  type: "expense",
  category: "",
  date: formatDateForForm(new Date()),
  user_id: "",
  account_id: "",
  to_account_id: "",
  frequency: "once",
};

export function useTransactionFormController(
  options: UseTransactionFormControllerOptions = {}
): UseTransactionFormControllerResult {
  const { mode = "create", initialType = "expense", selectedUserId, initialTransaction } = options;

  const { data: users = [] } = useUsers();
  const { data: accounts = [] } = useAccounts();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  // Build initial form state
  const initialFormState: TransactionFormState = useMemo(() => {
    if (mode === "edit" && initialTransaction) {
      return createFormState<TransactionFormState>(
        {
          description: initialTransaction.description,
          amount: initialTransaction.amount?.toString?.() ?? "",
          type: initialTransaction.type,
          category: initialTransaction.category,
          date: formatDateForForm(initialTransaction.date),
          user_id: initialTransaction.user_id,
          account_id: initialTransaction.account_id,
          to_account_id: initialTransaction.to_account_id || "",
          frequency: initialTransaction.frequency || "once",
        },
        {
          ...defaultState,
        }
      );
    }

    // create mode defaults
    // Find selected user's default account (only if specific user, not "all")
    const selectedUser = selectedUserId && selectedUserId !== "all"
      ? users.find(u => u.id === selectedUserId)
      : null;
    const defaultAccountId = selectedUser?.default_account_id || "";

    return createFormState<TransactionFormState>(
      {
        type: initialType,
        user_id: selectedUserId || "",
        account_id: defaultAccountId,
        category: "",
      },
      {
        ...defaultState,
      }
    );
  }, [mode, initialTransaction, initialType, selectedUserId, users]);

  const [form, setForm] = useState<TransactionFormState>(initialFormState);
  const [initialSnapshot, setInitialSnapshot] = useState<TransactionFormState>(initialFormState);
  const [errors, setErrors] = useState<ValidationErrors<TransactionFormState>>({});

  // Reset controller only when the edited transaction actually changes (by ID)
  useEffect(() => {
    setForm(initialFormState);
    setInitialSnapshot(initialFormState);
    setErrors({});
  }, [mode, initialTransaction?.id, initialType, selectedUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isDirty = isFormDirty(form, initialSnapshot);

  const setField = useCallback(<K extends keyof TransactionFormState>(key: K, value: TransactionFormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      // When user_id changes, auto-select their default account (if not "all")
      if (key === "user_id" && value && value !== "all") {
        const selectedUser = users.find(u => u.id === value);

        // Check if current account belongs to the new user
        // Accounts have user_ids (array) - check if user has access
        const currentAccount = accounts.find(a => a.id === prev.account_id);
        const accountBelongsToUser = currentAccount?.user_ids?.includes(value);

        if (!accountBelongsToUser) {
          // Current account doesn't belong to new user, use default or clear
          next.account_id = selectedUser?.default_account_id || "";
          // Also clear to_account_id for transfers
          next.to_account_id = "";
        }
      }

      return next;
    });

    // Re-validate this field on change
    const fieldError = validateFieldByName<TransactionFormState>(key, value, transactionValidationSchema as any, {
      ...form,
      [key]: value,
    } as any);
    setErrors((prev) => ({
      ...prev,
      [key]: fieldError || undefined,
    }));
  }, [form, users, accounts]);

  const validateField = useCallback((key: keyof TransactionFormState) => {
    const fieldError = validateFieldByName<TransactionFormState>(key, (form as any)[key], transactionValidationSchema as any, form);
    setErrors((prev) => ({
      ...prev,
      [key]: fieldError || undefined,
    }));
  }, [form]);

  const reset = useCallback(() => {
    setForm(initialSnapshot);
    setErrors({});
  }, [initialSnapshot]);

  const submit = useCallback(async () => {
    // Run schema validation
    const { isValid, errors: validationErrors } = validateForm<TransactionFormState>(
      form,
      transactionValidationSchema as any
    );

    let nextErrors: ValidationErrors<TransactionFormState> = { ...validationErrors };

    // Custom cross-field validations
    const transferError = validateTransferTransaction({ type: form.type, to_account_id: form.to_account_id });
    if (transferError) {
      nextErrors = { ...nextErrors, to_account_id: transferError };
    }
    if (form.type === "transfer" && form.account_id && form.to_account_id && form.account_id === form.to_account_id) {
      nextErrors = { ...nextErrors, to_account_id: "Il conto origine e destinazione devono essere diversi" };
    }

    // If errors, stop
    if (!isValid || Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    // Build payload
    const sanitized = sanitizeFormState(form);

    // Enrich payload with numeric amount and ISO date
    const amountNum = typeof sanitized.amount === "string" ? Number.parseFloat(sanitized.amount) : (sanitized.amount as any);
    const dateIso = sanitized.date ? new Date(sanitized.date).toISOString() : new Date().toISOString();

    // Resolve group_id from selected user
    const user = users.find((u) => u.id === sanitized.user_id);

    if (mode === "edit" && initialTransaction) {
      await updateMutation.mutateAsync({
        id: initialTransaction.id,
        data: {
          description: sanitized.description,
          amount: amountNum,
          type: sanitized.type,
          category: sanitized.category,
          date: dateIso,
          user_id: sanitized.user_id,
          account_id: sanitized.account_id,
          to_account_id: sanitized.type === "transfer" ? sanitized.to_account_id || null : null,
          frequency: sanitized.frequency,
          updated_at: new Date().toISOString(),
        },
      });
      return;
    }

    // create mode
    const id = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await createMutation.mutateAsync({
      id,
      description: sanitized.description,
      amount: amountNum,
      type: sanitized.type,
      category: sanitized.category,
      date: dateIso,
      user_id: sanitized.user_id,
      account_id: sanitized.account_id,
      to_account_id: sanitized.type === "transfer" ? (sanitized.to_account_id || null) : null,
      frequency: sanitized.frequency as TransactionFrequencyType,
      group_id: user?.group_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Transaction);

    // After successful creation, update initial snapshot to current form (or reset)
    setInitialSnapshot(form);
  }, [form, mode, users, createMutation, updateMutation, initialTransaction]);

  return {
    form,
    errors,
    isSubmitting,
    isDirty,
    setField,
    validateField,
    reset,
    submit,
  };
}

export default useTransactionFormController;

