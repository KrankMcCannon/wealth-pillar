"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RecurringTransactionSeries, TransactionFrequencyType, TransactionType } from "@/lib/types";
import {
  validateForm,
  validateFieldByName,
  type ValidationErrors,
  recurringSeriesValidationSchema,
  validateDateRange,
} from "@/lib/services/form-validation.service";
import {
  createFormState,
  formStateToPayload,
  sanitizeFormState,
  isDirty as isFormDirty,
} from "@/lib/services/form-state.service";
import { useCreateRecurringSeries, useUpdateRecurringSeries } from "@/hooks";

export type RecurringFormMode = "create" | "edit";

export interface RecurringFormState {
  description: string;
  amount: string;
  type: TransactionType;
  category: string;
  frequency: TransactionFrequencyType;
  user_id: string;
  account_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // optional YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  is_active: boolean;
}

export interface UseRecurringSeriesFormControllerOptions {
  mode?: RecurringFormMode;
  selectedUserId?: string;
  initialSeries?: RecurringTransactionSeries | null;
}

export interface UseRecurringSeriesFormControllerResult {
  form: RecurringFormState;
  errors: ValidationErrors<RecurringFormState> & { end_date?: string | undefined };
  isSubmitting: boolean;
  isDirty: boolean;
  setField: <K extends keyof RecurringFormState>(key: K, value: RecurringFormState[K]) => void;
  validateField: (key: keyof RecurringFormState) => void;
  reset: () => void;
  submit: () => Promise<void>;
}

const today = () => new Date().toISOString().split("T")[0];

const defaultState: RecurringFormState = {
  description: "",
  amount: "",
  type: "expense",
  category: "",
  frequency: "monthly",
  user_id: "",
  account_id: "",
  start_date: today(),
  end_date: "",
  due_date: today(),
  is_active: true,
};

export function useRecurringSeriesFormController(
  options: UseRecurringSeriesFormControllerOptions = {}
): UseRecurringSeriesFormControllerResult {
  const { mode = "create", selectedUserId, initialSeries } = options;

  const createMutation = useCreateRecurringSeries();
  const updateMutation = useUpdateRecurringSeries();

  const initialFormState: RecurringFormState = useMemo(() => {
    if (mode === "edit" && initialSeries) {
      return createFormState<RecurringFormState>(
        {
          description: initialSeries.description,
          amount: String(initialSeries.amount ?? ""),
          type: initialSeries.type,
          category: initialSeries.category,
          frequency: initialSeries.frequency,
          user_id: initialSeries.user_id,
          account_id: initialSeries.account_id,
          start_date: new Date(initialSeries.start_date as any).toISOString().split("T")[0],
          end_date: initialSeries.end_date ? new Date(initialSeries.end_date as any).toISOString().split("T")[0] : "",
          due_date: new Date(initialSeries.due_date as any).toISOString().split("T")[0],
          is_active: initialSeries.is_active,
        },
        { ...defaultState }
      );
    }
    return createFormState<RecurringFormState>(
      { user_id: selectedUserId || "" },
      { ...defaultState }
    );
  }, [mode, initialSeries, selectedUserId]);

  const [form, setForm] = useState<RecurringFormState>(initialFormState);
  const [initialSnapshot, setInitialSnapshot] = useState<RecurringFormState>(initialFormState);
  const [errors, setErrors] = useState<ValidationErrors<RecurringFormState>>({});

  useEffect(() => {
    setForm(initialFormState);
    setInitialSnapshot(initialFormState);
    setErrors({});
  }, [initialFormState]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isDirty = isFormDirty(form, initialSnapshot);

  const setField = useCallback(<K extends keyof RecurringFormState>(key: K, value: RecurringFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    const fieldError = validateFieldByName<RecurringFormState>(key, value, recurringSeriesValidationSchema as any, { ...form, [key]: value } as any);
    setErrors((prev) => ({ ...prev, [key]: fieldError || undefined }));
  }, [form]);

  const validateField = useCallback((key: keyof RecurringFormState) => {
    const fieldError = validateFieldByName<RecurringFormState>(key, (form as any)[key], recurringSeriesValidationSchema as any, form);
    setErrors((prev) => ({ ...prev, [key]: fieldError || undefined }));
  }, [form]);

  const reset = useCallback(() => {
    setForm(initialSnapshot);
    setErrors({});
  }, [initialSnapshot]);

  const submit = useCallback(async () => {
    const { isValid, errors: validationErrors } = validateForm<RecurringFormState>(form, recurringSeriesValidationSchema as any);
    let nextErrors: ValidationErrors<RecurringFormState> = { ...validationErrors };

    // Cross-field: end_date after start_date
    const { endError } = validateDateRange(form.start_date, form.end_date || form.start_date, "Data inizio", "Data fine");
    if (endError) {
      nextErrors = { ...nextErrors, end_date: endError };
    }

    if (!isValid || Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const sanitized = sanitizeFormState(form);
    const payload = formStateToPayload(sanitized, mode);
    const amountNum = typeof sanitized.amount === "string" ? parseFloat(sanitized.amount) : (sanitized.amount as any);

    const base = {
      description: sanitized.description,
      amount: amountNum,
      type: sanitized.type,
      category: sanitized.category,
      frequency: sanitized.frequency,
      user_id: sanitized.user_id,
      account_id: sanitized.account_id,
      start_date: sanitized.start_date ? new Date(sanitized.start_date).toISOString() : new Date().toISOString(),
      end_date: sanitized.end_date ? new Date(sanitized.end_date).toISOString() : null,
      due_date: sanitized.due_date ? new Date(sanitized.due_date).toISOString() : new Date().toISOString(),
      is_active: sanitized.is_active,
    } as Partial<RecurringTransactionSeries>;

    if (mode === "edit" && initialSeries) {
      await updateMutation.mutateAsync({ id: initialSeries.id, data: base });
      return;
    }

    await createMutation.mutateAsync(base as Omit<RecurringTransactionSeries, "id">);
    setInitialSnapshot(form);
  }, [form, mode, initialSeries, createMutation, updateMutation]);

  return { form, errors, isSubmitting, isDirty, setField, validateField, reset, submit };
}

export default useRecurringSeriesFormController;

