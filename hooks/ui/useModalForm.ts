import { useState, useCallback, useMemo, useRef } from 'react';

/**
 * Configuration interface per il form hook
 * Principio ISP: Interface Segregation - opzioni specifiche e ben definite
 */
export interface UseModalFormConfig<T> {
  initialData: T;
  resetOnClose?: boolean;
  resetOnOpen?: boolean;
  validateOnChange?: boolean;
  debounceValidation?: number;
}

/**
 * Risultato del form hook con tipizzazione forte
 * Principio ISP: Interface Segregation - interfaccia chiara e completa
 */
export interface UseModalFormReturn<T> {
  // Data management
  data: T;
  updateField: (field: keyof T, value: any) => void;
  updateData: (newData: Partial<T>) => void;
  resetForm: () => void;
  
  // Error management
  errors: Record<string, string>;
  setError: (field: string, message: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  hasErrors: boolean;
  getFieldError: (field: keyof T) => string | undefined;
  
  // State management
  isSubmitting: boolean;
  setSubmitting: (submitting: boolean) => void;
  isDirty: boolean;
  isValid: boolean;
  
  // Validation
  validateRequired: (fields: Array<keyof T>) => boolean;
  validateField: (field: keyof T, validators?: FieldValidator<T>[]) => boolean;
  validateForm: (validators?: FormValidator<T>[]) => boolean;
  
  // Lifecycle
  handleModalOpen: () => void;
  handleModalClose: () => void;
}

/**
 * Validator function types per tipizzazione forte
 * Principio OCP: Open/Closed - estendibile per nuove validazioni
 */
export type FieldValidator<T> = (value: any, data: T) => string | null;
export type FormValidator<T> = (data: T) => Record<string, string>;

/**
 * Validator predefiniti comuni
 * Principio DRY: Don't Repeat Yourself - validatori riutilizzabili
 */
export const validators = {
  required: <T,>(message = 'Questo campo è obbligatorio'): FieldValidator<T> => 
    (value) => {
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        return message;
      }
      return null;
    },

  minLength: <T,>(min: number, message?: string): FieldValidator<T> => 
    (value) => {
      if (typeof value === 'string' && value.length < min) {
        return message || `Deve contenere almeno ${min} caratteri`;
      }
      return null;
    },

  maxLength: <T,>(max: number, message?: string): FieldValidator<T> => 
    (value) => {
      if (typeof value === 'string' && value.length > max) {
        return message || `Deve contenere massimo ${max} caratteri`;
      }
      return null;
    },

  email: <T,>(message = 'Email non valida'): FieldValidator<T> => 
    (value) => {
      if (typeof value === 'string' && value.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return message;
        }
      }
      return null;
    },

  positiveNumber: <T,>(message = 'Deve essere un numero positivo'): FieldValidator<T> => 
    (value) => {
      const num = Number(value);
      if (isNaN(num) || num <= 0) {
        return message;
      }
      return null;
    },

  pattern: <T,>(regex: RegExp, message: string): FieldValidator<T> => 
    (value) => {
      if (typeof value === 'string' && value.length > 0 && !regex.test(value)) {
        return message;
      }
      return null;
    },
};

/**
 * Hook ottimizzato per gestire form modali con validazione avanzata
 * Principio SRP: Single Responsibility - gestisce stato form e validazione
 * Principio OCP: Open/Closed - estendibile con nuovi validatori
 * Principio DRY: Don't Repeat Yourself - logica riutilizzabile
 * Principio DIP: Dependency Inversion - usa astrazioni per validazione
 */
export function useModalForm<T extends Record<string, any>>({
  initialData,
  resetOnClose = true,
  resetOnOpen = true,
  validateOnChange = false,
  debounceValidation = 300,
}: UseModalFormConfig<T>): UseModalFormReturn<T> {
  
  // Stati principali
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Ref per trackare il valore iniziale per il dirty check
  const initialDataRef = useRef<T>(initialData);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Calcola se il form è stato modificato
  const isDirty = useMemo(() => {
    return JSON.stringify(data) !== JSON.stringify(initialDataRef.current);
  }, [data]);

  // Calcola se il form è valido
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  // Calcola se ci sono errori
  const hasErrors = useMemo(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  /**
   * Reset del form ai valori iniziali
   * Principio SRP: Single Responsibility - solo reset
   */
  const resetForm = useCallback(() => {
    setData(initialData);
    setErrors({});
    setIsSubmitting(false);
    initialDataRef.current = initialData;
  }, [initialData]);

  /**
   * Aggiorna un singolo campo
   * Principio SRP: Single Responsibility - solo aggiornamento campo
   * Performance ottimizzata: non dipende da errors
   */
  const updateField = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    setErrors(prev => {
      if (prev[field as string]) {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      }
      return prev;
    });

    // Validate on change if enabled
    if (validateOnChange) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        validateField(field);
      }, debounceValidation);
    }
  }, [validateOnChange, debounceValidation]);

  /**
   * Aggiorna multiple campi
   * Principio SRP: Single Responsibility - solo aggiornamento bulk
   */
  const updateData = useCallback((newData: Partial<T>) => {
    setData(prev => ({ ...prev, ...newData }));
    
    // Clear errors for updated fields
    const updatedFields = Object.keys(newData);
    if (updatedFields.length > 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        updatedFields.forEach(field => delete newErrors[field]);
        return newErrors;
      });
    }
  }, []);

  /**
   * Gestione errori
   */
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

  const getFieldError = useCallback((field: keyof T): string | undefined => {
    return errors[field as string];
  }, [errors]);

  /**
   * Validazione campo singolo
   * Principio SRP: Single Responsibility - solo validazione campo
   */
  const validateField = useCallback((field: keyof T, validators: FieldValidator<T>[] = []): boolean => {
    const value = data[field];
    let error: string | null = null;

    // Esegui tutti i validatori per questo campo
    for (const validator of validators) {
      error = validator(value, data);
      if (error) break;
    }

    if (error) {
      setError(field as string, error);
      return false;
    } else {
      clearError(field as string);
      return true;
    }
  }, [data, setError, clearError]);

  /**
   * Validazione required fields
   * Principio DRY: Don't Repeat Yourself - logica esistente migliorata
   */
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

  /**
   * Validazione form completa
   * Principio SRP: Single Responsibility - validazione completa
   */
  const validateForm = useCallback((validators: FormValidator<T>[] = []): boolean => {
    let allErrors: Record<string, string> = {};

    // Esegui tutti i validatori del form
    validators.forEach(validator => {
      const formErrors = validator(data);
      allErrors = { ...allErrors, ...formErrors };
    });

    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  }, [data]);

  /**
   * Lifecycle handlers per modali
   * Principio SRP: Single Responsibility - gestione lifecycle
   */
  const handleModalOpen = useCallback(() => {
    if (resetOnOpen) {
      resetForm();
    }
  }, [resetOnOpen, resetForm]);

  const handleModalClose = useCallback(() => {
    if (resetOnClose) {
      resetForm();
    }
  }, [resetOnClose, resetForm]);

  /**
   * Cleanup del debounce timeout
   */
  const setSubmitting = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting);
    if (submitting && debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  return {
    // Data management
    data,
    updateField,
    updateData,
    resetForm,
    
    // Error management
    errors,
    setError,
    clearError,
    clearAllErrors,
    hasErrors,
    getFieldError,
    
    // State management
    isSubmitting,
    setSubmitting,
    isDirty,
    isValid,
    
    // Validation
    validateRequired,
    validateField,
    validateForm,
    
    // Lifecycle
    handleModalOpen,
    handleModalClose,
  };
}

/**
 * Hook specializzato per form di Account
 * Principio SRP: Single Responsibility - solo form Account
 */
export const useAccountForm = (initialAccount: Partial<any>) => {
  return useModalForm({
    initialData: {
      name: '',
      type: '',
      balance: 0,
      personIds: [],
      ...initialAccount,
    },
    validateOnChange: true,
  });
};

/**
 * Hook specializzato per form di Person
 * Principio SRP: Single Responsibility - solo form Person
 */
export const usePersonForm = (initialPerson: Partial<any>) => {
  return useModalForm({
    initialData: {
      name: '',
      avatar: '',
      ...initialPerson,
    },
    validateOnChange: true,
  });
};
