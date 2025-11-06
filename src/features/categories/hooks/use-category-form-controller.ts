"use client";

import { Category, categoryValidationSchema, createFormState, isDirty as isFormDirty, sanitizeFormState, validateFieldByName, validateForm, ValidationErrors } from '@/src/lib';
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCreateCategory, useUpdateCategory } from "./use-category-mutations";

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
  mutationError: string | null;
  isSubmitting: boolean;
  isDirty: boolean;
  setField: <K extends keyof CategoryFormState>(key: K, value: CategoryFormState[K]) => void;
  validateField: (key: keyof CategoryFormState) => void;
  reset: () => void;
  submit: () => Promise<{ hasErrors: boolean }>;
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
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initialFormState);
    setInitialSnapshot(initialFormState);
    setErrors({});
    setMutationError(null);
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
    setMutationError(null);
  }, [initialSnapshot]);

  const submit = useCallback(async (): Promise<{ hasErrors: boolean }> => {
    // Clear previous mutation errors
    setMutationError(null);

    // For creation mode, key is auto-generated server-side, so we exclude it from validation
    const validationSchema = mode === 'create'
      ? { label: categoryValidationSchema.label, icon: categoryValidationSchema.icon, color: categoryValidationSchema.color }
      : categoryValidationSchema;

    const { isValid, errors: validationErrors } = validateForm<CategoryFormState>(form, validationSchema as any);
    if (!isValid) {
      setErrors(validationErrors);
      return { hasErrors: true };
    }

    const sanitized = sanitizeFormState(form);

    try {
      if (mode === "edit" && initialCategory) {
        await updateMutation.mutateAsync({
          id: initialCategory.id,
          data: {
            label: sanitized.label,
            icon: sanitized.icon,
            color: sanitized.color.toLowerCase(),
          },
        });
      } else {
        await createMutation.mutateAsync({
          label: sanitized.label,
          icon: sanitized.icon,
          color: sanitized.color.toLowerCase(),
        } as Omit<Category, "id" | "created_at" | "updated_at" | "key">);
      }

      setInitialSnapshot(form);
      return { hasErrors: false };
    } catch (err) {
      // Capture mutation error and re-throw for form to handle
      const errorMessage = err instanceof Error ? err.message : 'Errore durante il salvataggio della categoria';
      setMutationError(errorMessage);
      throw err;
    }
  }, [form, mode, initialCategory, createMutation, updateMutation]);

  return { form, errors, mutationError, isSubmitting, isDirty, setField, validateField, reset, submit };
}

export default useCategoryFormController;

