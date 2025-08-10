/**
 * Validation Utilities
 * Centralizza le logiche di validazione seguendo il principio DRY
 */

import { ErrorCodes } from './error-handler';

export interface ValidationRule<T = any> {
  field: string;
  validator: (value: T) => boolean;
  message: string;
  code?: ErrorCodes;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: ErrorCodes;
  }>;
}

/**
 * Utility class per validazioni comuni
 */
export class ValidationUtils {
  /**
   * Valida che un campo sia presente e non vuoto
   */
  static required(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  /**
   * Valida che un numero sia positivo
   */
  static isPositiveNumber(value: any): boolean {
    return typeof value === 'number' && value > 0;
  }

  /**
   * Valida che un numero sia non negativo
   */
  static isNonNegativeNumber(value: any): boolean {
    return typeof value === 'number' && value >= 0;
  }

  /**
   * Valida che una stringa non sia vuota dopo trim
   */
  static isNonEmptyString(value: any): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * Valida che una data sia valida
   */
  static isValidDate(value: any): boolean {
    if (!value) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  /**
   * Valida che un array non sia vuoto
   */
  static isNonEmptyArray(value: any): boolean {
    return Array.isArray(value) && value.length > 0;
  }

  /**
   * Valida che un valore sia in un insieme di valori validi
   */
  static isInEnum<T>(validValues: T[]) {
    return (value: any): boolean => {
      return validValues.includes(value);
    };
  }

  /**
   * Valida che una stringa corrisponda a un pattern regex
   */
  static matchesPattern(pattern: RegExp) {
    return (value: any): boolean => {
      return typeof value === 'string' && pattern.test(value);
    };
  }

  /**
   * Valida che un numero sia in un range specifico
   */
  static isInRange(min: number, max: number) {
    return (value: any): boolean => {
      return typeof value === 'number' && value >= min && value <= max;
    };
  }

  /**
   * Valida che una stringa abbia una lunghezza specifica
   */
  static hasLength(min?: number, max?: number) {
    return (value: any): boolean => {
      if (typeof value !== 'string') return false;
      const length = value.length;
      
      if (min !== undefined && length < min) return false;
      if (max !== undefined && length > max) return false;
      
      return true;
    };
  }
}

/**
 * Validator class per eseguire multiple validazioni
 */
export class Validator {
  private rules: ValidationRule[] = [];

  /**
   * Aggiunge una regola di validazione
   */
  addRule<T>(
    field: string,
    validator: (value: T) => boolean,
    message: string,
    code: ErrorCodes = ErrorCodes.VALIDATION_ERROR
  ): this {
    this.rules.push({ field, validator, message, code });
    return this;
  }

  /**
   * Validazione shorthand per campi richiesti
   */
  required(field: string, message?: string): this {
    return this.addRule(
      field,
      ValidationUtils.required,
      message || `${field} è richiesto`,
      ErrorCodes.MISSING_REQUIRED_FIELD
    );
  }

  /**
   * Validazione shorthand per numeri positivi
   */
  positiveNumber(field: string, message?: string): this {
    return this.addRule(
      field,
      ValidationUtils.isPositiveNumber,
      message || `${field} deve essere un numero positivo`,
      ErrorCodes.INVALID_RANGE
    );
  }

  /**
   * Validazione shorthand per stringhe non vuote
   */
  nonEmptyString(field: string, message?: string): this {
    return this.addRule(
      field,
      ValidationUtils.isNonEmptyString,
      message || `${field} non può essere vuoto`,
      ErrorCodes.MISSING_REQUIRED_FIELD
    );
  }

  /**
   * Validazione shorthand per date valide
   */
  validDate(field: string, message?: string): this {
    return this.addRule(
      field,
      ValidationUtils.isValidDate,
      message || `${field} deve essere una data valida`,
      ErrorCodes.INVALID_FORMAT
    );
  }

  /**
   * Validazione shorthand per array non vuoti
   */
  nonEmptyArray(field: string, message?: string): this {
    return this.addRule(
      field,
      ValidationUtils.isNonEmptyArray,
      message || `${field} deve contenere almeno un elemento`,
      ErrorCodes.MISSING_REQUIRED_FIELD
    );
  }

  /**
   * Esegue tutte le validazioni su un oggetto
   */
  validate(obj: Record<string, any>): ValidationResult {
    const errors: ValidationResult['errors'] = [];

    for (const rule of this.rules) {
      const value = this.getNestedValue(obj, rule.field);
      
      if (!rule.validator(value)) {
        errors.push({
          field: rule.field,
          message: rule.message,
          code: rule.code || ErrorCodes.VALIDATION_ERROR,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida e lancia un errore se la validazione fallisce
   */
  validateAndThrow(obj: Record<string, any>): void {
    const result = this.validate(obj);
    
    if (!result.isValid) {
      const firstError = result.errors[0];
      throw new Error(`${firstError.message} (campo: ${firstError.field})`);
    }
  }

  /**
   * Ottiene un valore da un oggetto usando una stringa con dot notation
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Resetta tutte le regole
   */
  reset(): this {
    this.rules = [];
    return this;
  }
}

/**
 * Factory per creare validator comuni
 */
export class ValidatorFactory {
  /**
   * Crea un validator per Person
   */
  static createPersonValidator(): Validator {
    return new Validator()
      .required('name')
      .nonEmptyString('name')
      .addRule(
        'budgetStartDate',
        (value) => {
          if (!value) return true;
          const numValue = typeof value === 'string' ? parseInt(value) : value;
          return ValidationUtils.isInRange(1, 31)(numValue);
        },
        'La data di inizio budget deve essere tra 1 e 31',
        ErrorCodes.INVALID_RANGE
      );
  }

  /**
   * Crea un validator per Account
   */
  static createAccountValidator(): Validator {
    return new Validator()
      .required('name')
      .nonEmptyString('name')
      .required('type')
      .nonEmptyString('type')
      .addRule('balance', ValidationUtils.isNonNegativeNumber, 'Il bilancio deve essere un numero non negativo')
      .nonEmptyArray('personIds');
  }

  /**
   * Crea un validator per Transaction
   */
  static createTransactionValidator(): Validator {
    return new Validator()
      .required('description')
      .nonEmptyString('description')
      .required('amount')
      .positiveNumber('amount')
      .required('date')
      .validDate('date')
      .required('type')
      .required('category')
      .nonEmptyString('category')
      .required('accountId')
      .nonEmptyString('accountId');
  }

  /**
   * Crea un validator per Budget
   */
  static createBudgetValidator(): Validator {
    return new Validator()
      .required('description')
      .nonEmptyString('description')
      .required('amount')
      .positiveNumber('amount')
      .required('period')
      .addRule(
        'period',
        ValidationUtils.isInEnum(['monthly', 'yearly']),
        'Il periodo deve essere "monthly" o "yearly"'
      )
      .required('personId')
      .nonEmptyString('personId')
      .nonEmptyArray('categories');
  }

  /**
   * Crea un validator per Category
   */
  static createCategoryValidator(): Validator {
    return new Validator()
      .required('name')
      .nonEmptyString('name');
  }
}
