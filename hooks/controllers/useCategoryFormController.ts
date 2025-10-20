"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Category } from "@/lib/types";
import {
  validateForm,
  validateFieldByName,
  type ValidationErrors,
  categoryValidationSchema,
} from "@/lib/services/form-validation.service";
import {
  createFormState,
  formStateToPayload,
  sanitizeFormState,
  isDirty as isFormDirty,
} from "@/lib/services/form-state.service";
import { useCreateCategory, useUpdateCategory } from "@/hooks/use-category-mutations";

export type CategoryFormMode = "create" | "edit";

export interface CategoryFormState {
  label: string;
  key: string;
  icon: string;
  color: string;
}

export interface UseCategoryFormControllerOptions {
  mode?: CategoryFormMode;
  initialCategory?: Category | null;
}

export interface UseCategoryFormControllerResult {
  form: CategoryFormState;
  errors: ValidationErrors<CategoryFormState>;
  isSubmitting: boolean;
  isDirty: boolean;
  setField: <K extends keyof CategoryFormState>(key: K, value: CategoryFormState[K]) => void;
  validateField: (key: keyof CategoryFormState) => void;
  reset: () => void;
  submit: () => Promise<void>;
}

const defaultState: CategoryFormState = {
  label: "",
  key: "",
  icon: "🏷️",
  color: "#6366F1",
};

export function useCategoryFormController(
  options: UseCategoryFormControllerOptions = {}
): UseCategoryFormControllerResult {
  const { mode = "create", initialCategory } = options;

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const initialFormState: CategoryFormState = useMemo(() => {
    if (mode === "edit" && initialCategory) {
      return createFormState<CategoryFormState>(
        {
          label: initialCategory.label,
          key: initialCategory.key,
          icon: initialCategory.icon,
          color: initialCategory.color,
        },
        { ...defaultState }
      );
    }
    return { ...defaultState };
  }, [mode, initialCategory]);

  const [form, setForm] = useState<CategoryFormState>(initialFormState);
  const [initialSnapshot, setInitialSnapshot] = useState<CategoryFormState>(initialFormState);
  const [errors, setErrors] = useState<ValidationErrors<CategoryFormState>>({});

  useEffect(() => {
    setForm(initialFormState);
    setInitialSnapshot(initialFormState);
    setErrors({});
  }, [initialFormState]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isDirty = isFormDirty(form, initialSnapshot);

  const setField = useCallback(<K extends keyof CategoryFormState>(key: K, value: CategoryFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    const fieldError = validateFieldByName<CategoryFormState>(key, value, categoryValidationSchema as any, { ...form, [key]: value } as any);
    setErrors((prev) => ({ ...prev, [key]: fieldError || undefined }));
  }, [form]);

  const validateField = useCallback((key: keyof CategoryFormState) => {
    const fieldError = validateFieldByName<CategoryFormState>(key, (form as any)[key], categoryValidationSchema as any, form);
    setErrors((prev) => ({ ...prev, [key]: fieldError || undefined }));
  }, [form]);

  const reset = useCallback(() => {
    setForm(initialSnapshot);
    setErrors({});
  }, [initialSnapshot]);

  const submit = useCallback(async () => {
    const { isValid, errors: validationErrors } = validateForm<CategoryFormState>(form, categoryValidationSchema as any);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    const sanitized = sanitizeFormState(form);
    const payload = formStateToPayload(sanitized, mode);

    if (mode === "edit" && initialCategory) {
      await updateMutation.mutateAsync({
        id: initialCategory.id,
        data: {
          label: sanitized.label,
          key: sanitized.key,
          icon: sanitized.icon,
          color: sanitized.color,
        },
      });
      return;
    }

    await createMutation.mutateAsync({
      label: sanitized.label,
      key: sanitized.key,
      icon: sanitized.icon,
      color: sanitized.color,
    } as Omit<Category, "id" | "created_at" | "updated_at">);

    setInitialSnapshot(form);
  }, [form, mode, initialCategory, createMutation, updateMutation]);

  return { form, errors, isSubmitting, isDirty, setField, validateField, reset, submit };
}

export default useCategoryFormController;

