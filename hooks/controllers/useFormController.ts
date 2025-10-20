"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ValidationErrors, ValidationSchema } from "@/lib/services/form-validation.service";
import { validateForm, validateFieldByName } from "@/lib/services/form-validation.service";
import { createFormState, formStateToPayload, sanitizeFormState, isDirty as isFormDirty } from "@/lib/services/form-state.service";

export type GenericFormMode = "create" | "edit";

export interface UseFormControllerOptions<T extends Record<string, any>> {
  mode?: GenericFormMode;
  initialData?: Partial<T>;
  defaults: T;
  schema: ValidationSchema<T>;
  onSubmit: (data: T, payload: Partial<T>, mode: GenericFormMode) => Promise<void>;
}

export interface UseFormControllerResult<T extends Record<string, any>> {
  form: T;
  errors: ValidationErrors<T>;
  isSubmitting: boolean;
  isDirty: boolean;
  setField: <K extends keyof T>(key: K, value: T[K]) => void;
  validateField: (key: keyof T) => void;
  reset: () => void;
  submit: () => Promise<void>;
}

export function useFormController<T extends Record<string, any>>(
  options: UseFormControllerOptions<T>
): UseFormControllerResult<T> {
  const { mode = "create", initialData, defaults, schema, onSubmit } = options;

  const initialFormState: T = useMemo(() => createFormState<T>(initialData || {}, defaults), [initialData, defaults]);

  const [form, setForm] = useState<T>(initialFormState);
  const [initialSnapshot, setInitialSnapshot] = useState<T>(initialFormState);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setForm(initialFormState);
    setInitialSnapshot(initialFormState);
    setErrors({});
  }, [initialFormState]);

  const isDirty = isFormDirty(form, initialSnapshot);

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    const fieldError = validateFieldByName<T>(key, value, schema, { ...(form as any), [key]: value } as any);
    setErrors((prev) => ({ ...prev, [key]: fieldError || undefined }));
  }, [form, schema]);

  const validateField = useCallback((key: keyof T) => {
    const fieldError = validateFieldByName<T>(key, (form as any)[key], schema, form);
    setErrors((prev) => ({ ...prev, [key]: fieldError || undefined }));
  }, [form, schema]);

  const reset = useCallback(() => {
    setForm(initialSnapshot);
    setErrors({});
  }, [initialSnapshot]);

  const submit = useCallback(async () => {
    const { isValid, errors: validationErrors } = validateForm<T>(form, schema);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const sanitized = sanitizeFormState(form);
      const payload = formStateToPayload(sanitized, mode);
      await onSubmit(sanitized as T, payload as Partial<T>, mode);
      setInitialSnapshot(form);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, schema, mode, onSubmit]);

  return { form, errors, isSubmitting, isDirty, setField, validateField, reset, submit };
}

export default useFormController;

