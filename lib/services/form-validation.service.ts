/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Form Validation Service
 *
 * Centralized validation logic for all forms in the application.
 * Provides consistent validation rules, error messages, and type-safe schemas.
 *
 * @module form-validation.service
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ValidationRule<T = any> = {
  validate: (value: T, formData?: any) => boolean;
  message: string;
};

export type ValidationSchema<T extends Record<string, any>> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

export type ValidationErrors<T extends Record<string, any>> = Partial<
  Record<keyof T, string>
>;

export type ValidationResult<T extends Record<string, any>> = {
  isValid: boolean;
  errors: ValidationErrors<T>;
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Creates a required field validation rule
 */
export function required(fieldName: string): ValidationRule {
  return {
    validate: (value) => {
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return value != null && value !== '';
    },
    message: `${fieldName} è obbligatorio`,
  };
}

/**
 * Creates a minimum length validation rule
 */
export function minLength(min: number, fieldName: string): ValidationRule<string> {
  return {
    validate: (value) => value?.trim().length >= min,
    message: `${fieldName} deve contenere almeno ${min} caratteri`,
  };
}

/**
 * Creates a maximum length validation rule
 */
export function maxLength(max: number, fieldName: string): ValidationRule<string> {
  return {
    validate: (value) => !value || value.trim().length <= max,
    message: `${fieldName} non può superare ${max} caratteri`,
  };
}

/**
 * Creates an amount validation rule (positive number)
 */
export function positiveAmount(fieldName: string): ValidationRule<string | number> {
  return {
    validate: (value) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) && num > 0;
    },
    message: `${fieldName} deve essere un numero positivo`,
  };
}

/**
 * Creates a non-negative amount validation rule (>= 0)
 */
export function nonNegativeAmount(fieldName: string): ValidationRule<string | number> {
  return {
    validate: (value) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) && num >= 0;
    },
    message: `${fieldName} deve essere un numero maggiore o uguale a zero`,
  };
}

/**
 * Creates a valid date validation rule
 */
export function validDate(fieldName: string): ValidationRule<string> {
  return {
    validate: (value) => {
      if (!value) return false;
      const date = new Date(value);
      return date instanceof Date && !isNaN(date.getTime());
    },
    message: `${fieldName} non è una data valida`,
  };
}

/**
 * Creates a date not in future validation rule
 */
export function dateNotInFuture(fieldName: string): ValidationRule<string> {
  return {
    validate: (value) => {
      if (!value) return true;
      const date = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return date <= today;
    },
    message: `${fieldName} non può essere nel futuro`,
  };
}

/**
 * Creates an email validation rule
 */
export function email(fieldName: string): ValidationRule<string> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    validate: (value) => !value || emailRegex.test(value),
    message: `${fieldName} deve essere un'email valida`,
  };
}

/**
 * Creates a pattern validation rule
 */
export function pattern(
  regex: RegExp,
  fieldName: string,
  message?: string
): ValidationRule<string> {
  return {
    validate: (value) => !value || regex.test(value),
    message: message || `${fieldName} non è nel formato corretto`,
  };
}

/**
 * Creates a min value validation rule
 */
export function minValue(
  min: number,
  fieldName: string
): ValidationRule<string | number> {
  return {
    validate: (value) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return isNaN(num) || num >= min;
    },
    message: `${fieldName} deve essere almeno ${min}`,
  };
}

/**
 * Creates a max value validation rule
 */
export function maxValue(
  max: number,
  fieldName: string
): ValidationRule<string | number> {
  return {
    validate: (value) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return isNaN(num) || num <= max;
    },
    message: `${fieldName} non può essere maggiore di ${max}`,
  };
}

/**
 * Creates an array not empty validation rule
 */
export function arrayNotEmpty<T>(fieldName: string): ValidationRule<T[]> {
  return {
    validate: (value) => Array.isArray(value) && value.length > 0,
    message: `${fieldName} deve contenere almeno un elemento`,
  };
}

/**
 * Creates a conditional validation rule
 */
export function conditional<T>(
  condition: (value: T, formData?: any) => boolean,
  rule: ValidationRule<T>
): ValidationRule<T> {
  return {
    validate: (value, formData) => {
      if (!condition(value, formData)) {
        return true; // Skip validation if condition not met
      }
      return rule.validate(value);
    },
    message: rule.message,
  };
}

// ============================================================================
// VALIDATION SCHEMAS (PRE-BUILT)
// ============================================================================

/**
 * Transaction form validation schema
 */
export const transactionValidationSchema = {
  description: [required('La descrizione')],
  amount: [required('L\'importo'), positiveAmount('L\'importo')],
  type: [required('Il tipo')],
  category: [required('La categoria')],
  date: [required('La data'), validDate('La data'), dateNotInFuture('La data')],
  user_id: [required('L\'utente')],
  account_id: [required('Il conto')],
};

/**
 * Budget form validation schema
 */
export const budgetValidationSchema = {
  description: [required('La descrizione')],
  amount: [required('L\'importo'), positiveAmount('L\'importo')],
  type: [required('Il tipo di budget')],
  categories: [arrayNotEmpty('Le categorie')],
  user_id: [required('L\'utente')],
};

/**
 * Category form validation schema
 */
export const categoryValidationSchema = {
  label: [required('L\'etichetta'), minLength(2, 'L\'etichetta')],
  key: [
    required('La chiave'),
    minLength(2, 'La chiave'),
    pattern(/^[a-z0-9-]+$/, 'La chiave', 'La chiave può contenere solo lettere minuscole, numeri e trattini'),
  ],
  icon: [required('L\'icona')],
  color: [required('Il colore')],
};

/**
 * Recurring series form validation schema
 */
export const recurringSeriesValidationSchema = {
  description: [required('La descrizione')],
  amount: [required('L\'importo'), positiveAmount('L\'importo')],
  type: [required('Il tipo')],
  category: [required('La categoria')],
  frequency: [required('La frequenza')],
  user_id: [required('L\'utente')],
  account_id: [required('Il conto')],
  start_date: [required('La data di inizio'), validDate('La data di inizio')],
  due_date: [required('La data di scadenza'), validDate('La data di scadenza')],
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates a single field against its rules
 */
export function validateField<T>(
  value: T,
  rules: ValidationRule<T>[],
  formData?: any
): string | null {
  for (const rule of rules) {
    if (!rule.validate(value, formData)) {
      return rule.message;
    }
  }
  return null;
}

/**
 * Validates entire form data against a schema
 */
export function validateForm<T extends Record<string, any>>(
  formData: T,
  schema: ValidationSchema<T>
): ValidationResult<T> {
  const errors: ValidationErrors<T> = {};
  let isValid = true;

  for (const [field, rules] of Object.entries(schema) as [keyof T, ValidationRule[]][]) {
    if (!rules) continue;

    const value = formData[field];
    const error = validateField(value, rules, formData);

    if (error) {
      errors[field] = error;
      isValid = false;
    }
  }

  return { isValid, errors };
}

/**
 * Validates a single field by name using a schema
 */
export function validateFieldByName<T extends Record<string, any>>(
  fieldName: keyof T,
  value: any,
  schema: ValidationSchema<T>,
  formData?: T
): string | null {
  const rules = schema[fieldName];
  if (!rules) return null;

  return validateField(value, rules, formData);
}

/**
 * Clears error for a specific field
 */
export function clearFieldError<T extends Record<string, any>>(
  errors: ValidationErrors<T>,
  fieldName: keyof T
): ValidationErrors<T> {
  const newErrors = { ...errors };
  delete newErrors[fieldName];
  return newErrors;
}

/**
 * Sets error for a specific field
 */
export function setFieldError<T extends Record<string, any>>(
  errors: ValidationErrors<T>,
  fieldName: keyof T,
  error: string
): ValidationErrors<T> {
  return {
    ...errors,
    [fieldName]: error,
  };
}

/**
 * Checks if there are any validation errors
 */
export function hasErrors<T extends Record<string, any>>(
  errors: ValidationErrors<T>
): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Gets first error message from errors object
 */
export function getFirstError<T extends Record<string, any>>(
  errors: ValidationErrors<T>
): string | null {
  const errorKeys = Object.keys(errors) as (keyof T)[];
  if (errorKeys.length === 0) return null;
  return errors[errorKeys[0]] || null;
}

// ============================================================================
// CUSTOM VALIDATORS FOR SPECIFIC FIELDS
// ============================================================================

/**
 * Validates transfer transaction (requires to_account_id)
 */
export function validateTransferTransaction(formData: {
  type: string;
  to_account_id?: string;
}): string | null {
  if (formData.type === 'transfer' && !formData.to_account_id) {
    return 'Il conto di destinazione è obbligatorio per i trasferimenti';
  }
  return null;
}

/**
 * Validates date range (end date must be after start date)
 */
export function validateDateRange(
  startDate: string,
  endDate: string,
  startFieldName = 'La data di inizio',
  endFieldName = 'La data di fine'
): { startError: string | null; endError: string | null } {
  if (!startDate || !endDate) {
    return { startError: null, endError: null };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return { startError: `${startFieldName} non è valida`, endError: null };
  }

  if (isNaN(end.getTime())) {
    return { startError: null, endError: `${endFieldName} non è valida` };
  }

  if (end < start) {
    return {
      startError: null,
      endError: `${endFieldName} deve essere successiva a ${startFieldName}`,
    };
  }

  return { startError: null, endError: null };
}

/**
 * Validates budget amount against total spending
 */
export function validateBudgetAmount(
  amount: number,
  currentSpending: number
): string | null {
  if (amount > 0 && currentSpending > amount) {
    return `L'importo del budget (€${amount.toFixed(2)}) è inferiore alla spesa corrente (€${currentSpending.toFixed(2)})`;
  }
  return null;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Sanitizes string input (trims whitespace)
 */
export function sanitizeString(value: string): string {
  return value?.trim() || '';
}

/**
 * Sanitizes number input (parses to float)
 */
export function sanitizeNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Sanitizes currency input (removes currency symbols, parses)
 */
export function sanitizeCurrency(value: string): number {
  if (!value) return 0;
  // Remove currency symbols, spaces, and replace comma with dot
  const cleaned = value.replace(/[€$\s]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors<T extends Record<string, any>>(
  errors: ValidationErrors<T>
): string {
  return Object.values(errors)
    .filter((error): error is string => typeof error === 'string')
    .join('. ');
}
