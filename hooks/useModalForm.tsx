import { useState, useCallback, useEffect } from 'react';

export interface UseModalFormConfig<T> {
  initialData: T;
  resetOnClose?: boolean;
  resetOnOpen?: boolean;
}

export interface UseModalFormReturn<T> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  updateField: (field: keyof T, value: any) => void;
  updateData: (newData: Partial<T>) => void;
  setError: (field: string, message: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  setSubmitting: (submitting: boolean) => void;
  resetForm: () => void;
  validateRequired: (fields: Array<keyof T>) => boolean;
}

/**
 * Hook personalizzato per gestire lo stato dei form nelle modali
 * Ottimizza le performance e centralizza la logica comune
 */
export function useModalForm<T extends Record<string, any>>({
  initialData,
  resetOnClose = true,
  resetOnOpen = true,
}: UseModalFormConfig<T>): UseModalFormReturn<T> {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoized reset function
  const resetForm = useCallback(() => {
    setData(initialData);
    setErrors({});
    setIsSubmitting(false);
  }, [initialData]);

  // Optimized field update function
  const updateField = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  // Bulk data update
  const updateData = useCallback((newData: Partial<T>) => {
    setData(prev => ({ ...prev, ...newData }));
  }, []);

  // Error management
  const setError = useCallback((field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setSubmitting = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting);
  }, []);

  // Validation helper
  const validateRequired = useCallback((fields: Array<keyof T>): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const value = data[field];
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        newErrors[field as string] = 'Questo campo è obbligatorio';
        isValid = false;
      }
    });

    if (!isValid) {
      setErrors(prev => ({ ...prev, ...newErrors }));
    }

    return isValid;
  }, [data]);

  return {
    data,
    errors,
    isSubmitting,
    updateField,
    updateData,
    setError,
    clearError,
    clearAllErrors,
    setSubmitting,
    resetForm,
    validateRequired,
  };
}
