import { useState, useCallback, useMemo } from "react";

export interface ValidationRule<T> {
  field: keyof T;
  validator: (value: any, allData: T) => string | null;
}

export interface UseOnboardingFormConfig<T> {
  initialData: T;
  validationRules: ValidationRule<T>[];
  customValidation?: (data: T) => Record<string, string>;
}

export interface UseOnboardingFormReturn<T> {
  data: T;
  errors: Record<string, string>;
  isValid: boolean;
  isDirty: boolean;
  updateField: (field: keyof T, value: any) => void;
  updateData: (newData: Partial<T>) => void;
  validateForm: () => boolean;
  resetForm: () => void;
  clearErrors: () => void;
  setFieldError: (field: string, error: string) => void;
}

/**
 * Hook generico per gestire form di onboarding
 * Principio DRY: Centralizza la logica di validazione e gestione stato
 * Principio SRP: Si occupa solo della gestione form
 */
export function useOnboardingForm<T extends Record<string, any>>({
  initialData,
  validationRules,
  customValidation,
}: UseOnboardingFormConfig<T>): UseOnboardingFormReturn<T> {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  /**
   * Aggiorna un singolo campo e pulisce l'errore associato
   */
  const updateField = useCallback((field: keyof T, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);

    // Pulisci l'errore per questo campo
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  /**
   * Aggiorna più campi contemporaneamente
   */
  const updateData = useCallback((newData: Partial<T>) => {
    setData((prev) => ({ ...prev, ...newData }));
    setIsDirty(true);
  }, []);

  /**
   * Valida il form usando le regole specificate
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Applica le regole di validazione
    validationRules.forEach((rule) => {
      const error = rule.validator(data[rule.field], data);
      if (error) {
        newErrors[rule.field as string] = error;
      }
    });

    // Applica validazione personalizzata se presente
    if (customValidation) {
      const customErrors = customValidation(data);
      Object.assign(newErrors, customErrors);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data, validationRules, customValidation]);

  /**
   * Reset del form allo stato iniziale
   */
  const resetForm = useCallback(() => {
    setData(initialData);
    setErrors({});
    setIsDirty(false);
  }, [initialData]);

  /**
   * Pulisce tutti gli errori
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Imposta un errore specifico per un campo
   */
  const setFieldError = useCallback((field: string, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  /**
   * Il form è valido se non ci sono errori e tutti i campi richiesti sono compilati
   */
  const isValid = useMemo(() => {
    if (Object.keys(errors).length > 0) return false;

    // Controlla se tutti i campi richiesti sono compilati
    return validationRules.every((rule) => {
      const value = data[rule.field];
      return value !== null && value !== undefined && (typeof value !== "string" || value.trim() !== "");
    });
  }, [data, errors, validationRules]);

  return {
    data,
    errors,
    isValid,
    isDirty,
    updateField,
    updateData,
    validateForm,
    resetForm,
    clearErrors,
    setFieldError,
  };
}

/**
 * Validatori comuni per l'onboarding
 */
export const OnboardingValidators = {
  required:
    (fieldName: string) =>
    (value: any): string | null => {
      if (!value || (typeof value === "string" && !value.trim())) {
        return `${fieldName} è obbligatorio`;
      }
      return null;
    },

  minLength:
    (fieldName: string, minLength: number) =>
    (value: any): string | null => {
      if (typeof value === "string" && value.trim().length < minLength) {
        return `${fieldName} deve essere di almeno ${minLength} caratteri`;
      }
      return null;
    },

  positiveNumber:
    (fieldName: string) =>
    (value: any): string | null => {
      const num = Number(value);
      if (isNaN(num) || num <= 0) {
        return `${fieldName} deve essere un numero positivo`;
      }
      return null;
    },

  validBudgetDay:
    (fieldName: string) =>
    (value: any): string | null => {
      const day = Number(value);
      if (isNaN(day) || day < 1 || day > 31) {
        return `${fieldName} deve essere un giorno valido (1-31)`;
      }
      return null;
    },

  nonEmptyArray:
    (fieldName: string) =>
    (value: any): string | null => {
      if (!Array.isArray(value) || value.length === 0) {
        return `${fieldName} deve contenere almeno un elemento`;
      }
      return null;
    },
};
