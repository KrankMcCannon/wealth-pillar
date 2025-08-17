/**
 * General purpose validation utilities used across form hooks.
 * These functions encapsulate common validation logic such as checking
 * required fields, enforcing minimum lengths and ensuring positive numbers.
 * Extracting validation rules into a single module promotes reuse and
 * prevents duplication in feature hooks (DRY principle).
 */
export type ValidationErrors<T = any> = Partial<Record<keyof T | string, string>>;

export const Validators = {
  required(value: string | any[]): boolean {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null;
  },

  minLength(value: string, length: number): boolean {
    return value.trim().length >= length;
  },

  maxLength(value: string, length: number): boolean {
    return value.trim().length <= length;
  },

  positiveNumber(value: string | number): boolean {
    const num = typeof value === 'number' ? value : parseFloat(value);
    return !isNaN(num) && num > 0;
  },

  email(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }
};

export function validateAccountForm(data: { name: string; selectedPersonIds: string[] }): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!Validators.required(data.name)) {
    errors.name = 'Il nome del conto non può essere vuoto';
  }
  if (!Validators.required(data.selectedPersonIds)) {
    errors.selectedPersonIds = 'Seleziona almeno una persona per questo conto';
  }
  return errors;
}

export function validateBudgetForm(data: { description: string; amount: string; selectedCategories: string[] }): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!Validators.required(data.description)) {
    errors.description = 'La descrizione non può essere vuota';
  }
  if (!Validators.required(data.amount) || !Validators.positiveNumber(data.amount)) {
    errors.amount = 'Inserisci un importo valido e positivo';
  }
  if (!Validators.required(data.selectedCategories)) {
    errors.selectedCategories = 'Seleziona almeno una categoria';
  }
  return errors;
}

export function validateEditBudgetForm(data: {
  description: string;
  amount: string;
  selectedCategories: string[];
  budgetStartDay: string;
}): ValidationErrors {
  const errors = validateBudgetForm(data);
  const day = parseInt(data.budgetStartDay, 10);
  if (isNaN(day) || day < 1 || day > 28) {
    errors.budgetStartDay = 'Il giorno di inizio deve essere tra 1 e 28';
  }
  return errors;
}

export function validatePersonForm(data: { name: string }): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!Validators.required(data.name)) {
    errors.name = 'Il nome non può essere vuoto';
  } else if (!Validators.minLength(data.name, 2)) {
    errors.name = 'Il nome deve contenere almeno 2 caratteri';
  }
  return errors;
}
