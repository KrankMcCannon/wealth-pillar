/**
 * Shared Validation Utilities
 *
 * Centralized validation helpers to reduce code duplication across services.
 * All validators throw descriptive errors on validation failure.
 */

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/**
 * Validates that a string is a valid email format.
 */
export const isValidEmail = (email: string): boolean => EMAIL_REGEX.test(email);

/**
 * Validates that a string is non-empty after trimming.
 * @throws Error if value is undefined, null, or empty after trimming
 */
export function validateRequiredString(
  value: string | undefined | null,
  fieldName: string
): string {
  if (!value || value.trim() === '') {
    throw new Error(`${fieldName} is required`);
  }
  return value.trim();
}

/**
 * Validates that a string ID is non-empty.
 * Alias for validateRequiredString with consistent error messaging.
 */
export function validateId(value: string | undefined | null, fieldName: string = 'ID'): string {
  return validateRequiredString(value, fieldName);
}

/**
 * Validates that a number is positive (greater than zero).
 * @throws Error if value is undefined, null, zero, or negative
 */
export function validatePositiveNumber(
  value: number | undefined | null,
  fieldName: string
): number {
  if (value === undefined || value === null || value <= 0) {
    throw new Error(`${fieldName} must be greater than zero`);
  }
  return value;
}

/**
 * Validates that a number is non-negative (zero or greater).
 * @throws Error if value is undefined, null, or negative
 */
export function validateNonNegativeNumber(
  value: number | undefined | null,
  fieldName: string
): number {
  if (value === undefined || value === null || value < 0) {
    throw new Error(`${fieldName} must be zero or greater`);
  }
  return value;
}

/**
 * Validates that a string meets minimum length requirement.
 * @throws Error if value is too short
 */
export function validateMinLength(value: string, minLength: number, fieldName: string): string {
  if (value.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters`);
  }
  return value;
}

/**
 * Validates that a string does not exceed maximum length.
 * @throws Error if value is too long
 */
export function validateMaxLength(value: string, maxLength: number, fieldName: string): string {
  if (value.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or less`);
  }
  return value;
}

/**
 * Validates that an array is non-empty.
 * @throws Error if array is undefined, null, or empty
 */
export function validateNonEmptyArray<T>(value: T[] | undefined | null, fieldName: string): T[] {
  if (!value || value.length === 0) {
    throw new Error(`At least one ${fieldName} is required`);
  }
  return value;
}

/**
 * Validates that a value is one of the allowed options.
 * @throws Error if value is not in the allowed list
 */
export function validateEnum<T extends string>(
  value: T | undefined | null,
  allowedValues: readonly T[],
  fieldName: string
): T {
  if (!value || !allowedValues.includes(value)) {
    throw new Error(`Invalid ${fieldName}. Allowed values: ${allowedValues.join(', ')}`);
  }
  return value;
}

/**
 * Validates an object has at least one key.
 * Useful for update operations.
 * @throws Error if object is empty
 */
export function validateNonEmptyUpdate<T extends Record<string, unknown>>(
  updates: T | undefined | null,
  entityName: string = 'update'
): T {
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error(`At least one field must be provided for ${entityName}`);
  }
  return updates;
}
