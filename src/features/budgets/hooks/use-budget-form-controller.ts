"use client";

import { Budget, BudgetType, budgetValidationSchema, createFormState, isDirty as isFormDirty, sanitizeFormState, validateFieldByName, validateForm, ValidationErrors } from '@/src/lib';
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCreateBudget, useUpdateBudget } from "./use-budget-mutations";

export type BudgetFormMode = "create" | "edit";

export interface BudgetFormState {
  description: string;
  amount: string;
  type: BudgetType;
  categories: string[];
  user_id: string;
}

export interface UseBudgetFormControllerOptions {
  mode?: BudgetFormMode;
  selectedUserId?: string;
  initialBudget?: Budget | null;
}

export interface UseBudgetFormControllerResult {
  form: BudgetFormState;
  errors: ValidationErrors<BudgetFormState>;
  isSubmitting: boolean;
  isDirty: boolean;
  setField: <K extends keyof BudgetFormState>(key: K, value: BudgetFormState[K]) => void;
  toggleCategory: (key: string) => void;
  validateField: (key: keyof BudgetFormState) => void;
  reset: () => void;
  submit: () => Promise<void>;
}

const defaultState: BudgetFormState = {
  description: "",
  amount: "",
  type: "monthly",
  categories: [],
  user_id: "",
};

export function useBudgetFormController(
  options: UseBudgetFormControllerOptions = {}
): UseBudgetFormControllerResult {
  const { mode = "create", selectedUserId, initialBudget } = options;

  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();

  const initialFormState: BudgetFormState = useMemo(() => {
    if (mode === "edit" && initialBudget) {
      return createFormState<BudgetFormState>(
        {
          description: initialBudget.description,
          amount: String(initialBudget.amount ?? ""),
          type: initialBudget.type,
          categories: initialBudget.categories || [],
          user_id: initialBudget.user_id,
        },
        { ...defaultState }
      );
    }
    return createFormState<BudgetFormState>(
      { user_id: selectedUserId || "" },
      { ...defaultState }
    );
  }, [mode, initialBudget, selectedUserId]);

  const [form, setForm] = useState<BudgetFormState>(initialFormState);
  const [initialSnapshot, setInitialSnapshot] = useState<BudgetFormState>(initialFormState);
  const [errors, setErrors] = useState<ValidationErrors<BudgetFormState>>({});

  useEffect(() => {
    setForm(initialFormState);
    setInitialSnapshot(initialFormState);
    setErrors({});
  }, [initialFormState]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isDirty = isFormDirty(form, initialSnapshot);

  const setField = useCallback(<K extends keyof BudgetFormState>(key: K, value: BudgetFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    const fieldError = validateFieldByName<BudgetFormState>(key, value, budgetValidationSchema as any, { ...form, [key]: value } as any);
    setErrors((prev) => ({ ...prev, [key]: fieldError || undefined }));
  }, [form]);

  const toggleCategory = useCallback((categoryKey: string) => {
    setForm((prev) => {
      const exists = prev.categories.includes(categoryKey);
      const nextCategories = exists
        ? prev.categories.filter((c) => c !== categoryKey)
        : [...prev.categories, categoryKey];
      return { ...prev, categories: nextCategories };
    });
  }, []);

  const validateField = useCallback((key: keyof BudgetFormState) => {
    const fieldError = validateFieldByName<BudgetFormState>(key, (form as any)[key], budgetValidationSchema as any, form);
    setErrors((prev) => ({ ...prev, [key]: fieldError || undefined }));
  }, [form]);

  const reset = useCallback(() => {
    setForm(initialSnapshot);
    setErrors({});
  }, [initialSnapshot]);

  const submit = useCallback(async () => {
    const { isValid, errors: validationErrors } = validateForm<BudgetFormState>(form, budgetValidationSchema as any);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    const sanitized = sanitizeFormState(form);
    const amountNum = typeof sanitized.amount === "string" ? parseFloat(sanitized.amount) : (sanitized.amount as any);

    if (mode === "edit" && initialBudget) {
      await updateMutation.mutateAsync({
        id: initialBudget.id,
        data: {
          description: sanitized.description,
          amount: amountNum,
          type: sanitized.type,
          categories: sanitized.categories,
          user_id: sanitized.user_id,
        },
      });
      return;
    }

    await createMutation.mutateAsync({
      description: sanitized.description,
      amount: amountNum,
      type: sanitized.type as BudgetType,
      categories: sanitized.categories as string[],
      user_id: sanitized.user_id,
    } as Omit<Budget, "id" | "created_at" | "updated_at">);

    setInitialSnapshot(form);
  }, [form, mode, initialBudget, createMutation, updateMutation]);

  return { form, errors, isSubmitting, isDirty, setField, toggleCategory, validateField, reset, submit };
}

export default useBudgetFormController;

