/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Form State Management Service
 *
 * Provides utilities for managing form state in a predictable, immutable way.
 * Includes state creation, updates, dirty checking, and reset functionality.
 *
 * @module form-state.service
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type FormState<T extends Record<string, any>> = T;

export type FormField<T extends Record<string, any>> = keyof T;

export type DirtyFields<T extends Record<string, any>> = Partial<
  Record<keyof T, boolean>
>;

export type ChangedFields<T extends Record<string, any>> = Partial<T>;

// ============================================================================
// STATE CREATION & INITIALIZATION
// ============================================================================

/**
 * Creates initial form state with default values
 */
export function createFormState<T extends Record<string, any>>(
  initialData: Partial<T>,
  defaults: T
): FormState<T> {
  return {
    ...defaults,
    ...initialData,
  } as T;
}

/**
 * Creates empty form state for a given type
 */
export function createEmptyFormState<T extends Record<string, any>>(
  defaults: T
): FormState<T> {
  return { ...defaults };
}

/**
 * Resets form state to initial values
 */
export function resetFormState<T extends Record<string, any>>(
  initialData: T
): FormState<T> {
  return { ...initialData };
}

// ============================================================================
// STATE UPDATES (IMMUTABLE)
// ============================================================================

/**
 * Updates a single field in form state (immutable)
 */
export function updateFormField<T extends Record<string, any>>(
  state: FormState<T>,
  field: FormField<T>,
  value: T[FormField<T>]
): FormState<T> {
  return {
    ...state,
    [field]: value,
  };
}

/**
 * Updates multiple fields in form state (immutable)
 */
export function updateFormFields<T extends Record<string, any>>(
  state: FormState<T>,
  updates: Partial<T>
): FormState<T> {
  return {
    ...state,
    ...updates,
  };
}

/**
 * Clears a field (sets to empty/null based on type)
 */
export function clearFormField<T extends Record<string, any>>(
  state: FormState<T>,
  field: FormField<T>
): FormState<T> {
  const value = state[field];
  let emptyValue: any = '';

  // Determine appropriate empty value based on current value type
  if (typeof value === 'number') emptyValue = 0;
  else if (typeof value === 'boolean') emptyValue = false;
  else if (Array.isArray(value)) emptyValue = [];
  else if (value === null || value === undefined) emptyValue = null;

  return updateFormField(state, field, emptyValue);
}

// ============================================================================
// DIRTY CHECKING
// ============================================================================

/**
 * Checks if form state has changed from initial state
 */
export function isDirty<T extends Record<string, any>>(
  currentState: FormState<T>,
  initialState: FormState<T>
): boolean {
  const changedFields = getChangedFields(currentState, initialState);
  return Object.keys(changedFields).length > 0;
}

/**
 * Checks if a specific field is dirty
 */
export function isFieldDirty<T extends Record<string, any>>(
  currentState: FormState<T>,
  initialState: FormState<T>,
  field: FormField<T>
): boolean {
  return !deepEqual(currentState[field], initialState[field]);
}

/**
 * Gets all dirty fields (fields that have changed)
 */
export function getDirtyFields<T extends Record<string, any>>(
  currentState: FormState<T>,
  initialState: FormState<T>
): DirtyFields<T> {
  const dirtyFields: DirtyFields<T> = {};

  for (const key of Object.keys(currentState) as FormField<T>[]) {
    if (isFieldDirty(currentState, initialState, key)) {
      dirtyFields[key] = true;
    }
  }

  return dirtyFields;
}

/**
 * Gets changed fields with their new values
 */
export function getChangedFields<T extends Record<string, any>>(
  currentState: FormState<T>,
  initialState: FormState<T>
): ChangedFields<T> {
  const changedFields: ChangedFields<T> = {};

  for (const key of Object.keys(currentState) as FormField<T>[]) {
    if (isFieldDirty(currentState, initialState, key)) {
      changedFields[key] = currentState[key];
    }
  }

  return changedFields;
}

// ============================================================================
// DEEP EQUALITY CHECKING
// ============================================================================

/**
 * Deep equality check for values
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (a == null || b == null) return a === b;

  if (typeof a !== 'object' || typeof b !== 'object') return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => deepEqual(a[key], b[key]));
}

// ============================================================================
// PREFILLING & DEFAULT VALUES
// ============================================================================

/**
 * Prefills form state with user-specific defaults
 */
export function prefillUserDefaults<T extends Record<string, any> & { user_id?: string }>(
  state: FormState<T>,
  userId: string,
  additionalDefaults?: Partial<T>
): FormState<T> {
  return {
    ...state,
    user_id: userId as any,
    ...additionalDefaults,
  };
}

/**
 * Prefills account_id based on user's default account
 */
export function prefillDefaultAccount<
  T extends Record<string, any> & { account_id?: string }
>(
  state: FormState<T>,
  accountId: string
): FormState<T> {
  return {
    ...state,
    account_id: accountId as any,
  };
}

/**
 * Prefills today's date
 */
export function prefillTodayDate<
  T extends Record<string, any> & { date?: string }
>(state: FormState<T>, fieldName: keyof T = 'date' as keyof T): FormState<T> {
  return {
    ...state,
    [fieldName]: new Date().toISOString().split('T')[0],
  };
}

// ============================================================================
// FORM STATE TRANSFORMATIONS
// ============================================================================

/**
 * Transforms form state to API payload (removes empty fields)
 */
export function formStateToPayload<T extends Record<string, any>>(
  state: FormState<T>,
  mode: 'create' | 'edit'
): Partial<T> {
  const payload: Partial<T> = {};

  for (const [key, value] of Object.entries(state)) {
    // Skip empty strings and null values in create mode
    if (mode === 'create' && (value === '' || value === null)) {
      continue;
    }

    // Include all fields in edit mode (to allow clearing)
    payload[key as keyof T] = value;
  }

  return payload;
}

/**
 * Transforms API data to form state
 */
export function payloadToFormState<T extends Record<string, any>>(
  payload: Partial<T>,
  defaults: T
): FormState<T> {
  return {
    ...defaults,
    ...payload,
  };
}

/**
 * Sanitizes form state before submission
 */
export function sanitizeFormState<T extends Record<string, any>>(
  state: FormState<T>
): FormState<T> {
  const sanitized = { ...state };

  for (const [key, value] of Object.entries(sanitized)) {
    // Trim strings
    if (typeof value === 'string') {
      sanitized[key as keyof T] = value.trim() as any;
    }

    // Convert empty strings to null for optional fields
    if (value === '') {
      sanitized[key as keyof T] = null as any;
    }
  }

  return sanitized;
}

// ============================================================================
// FIELD-SPECIFIC HELPERS
// ============================================================================

/**
 * Converts form amount to number (handles string input)
 */
export function getNumericAmount(amount: string | number): number {
  if (typeof amount === 'number') return amount;
  const parsed = parseFloat(amount);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Converts number to form amount string
 */
export function formatAmountForForm(amount: number): string {
  return amount.toString();
}

/**
 * Formats date for form input (YYYY-MM-DD)
 */
export function formatDateForForm(date: Date | string): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toISOString().split('T')[0];
}

/**
 * Parses form date to Date object
 */
export function parseFormDate(dateString: string): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

// ============================================================================
// ARRAY FIELD HELPERS
// ============================================================================

/**
 * Toggles an item in an array field (for checkboxes)
 */
export function toggleArrayItem<T extends Record<string, any>, K extends keyof T>(
  state: FormState<T>,
  field: K,
  item: T[K] extends (infer U)[] ? U : never
): FormState<T> {
  const currentArray = (state[field] as any[]) || [];
  const index = currentArray.indexOf(item);

  const newArray =
    index === -1
      ? [...currentArray, item] // Add if not present
      : currentArray.filter((_, i) => i !== index); // Remove if present

  return updateFormField(state, field, newArray as any);
}

/**
 * Adds item to array field
 */
export function addArrayItem<T extends Record<string, any>, K extends keyof T>(
  state: FormState<T>,
  field: K,
  item: T[K] extends (infer U)[] ? U : never
): FormState<T> {
  const currentArray = (state[field] as any[]) || [];
  return updateFormField(state, field, [...currentArray, item] as any);
}

/**
 * Removes item from array field
 */
export function removeArrayItem<T extends Record<string, any>, K extends keyof T>(
  state: FormState<T>,
  field: K,
  item: T[K] extends (infer U)[] ? U : never
): FormState<T> {
  const currentArray = (state[field] as any[]) || [];
  return updateFormField(
    state,
    field,
    currentArray.filter((i) => i !== item) as any
  );
}

// ============================================================================
// CONDITIONAL FIELD MANAGEMENT
// ============================================================================

/**
 * Conditionally shows/hides fields based on form state
 */
export function shouldShowField<T extends Record<string, any>>(
  state: FormState<T>,
  condition: (state: FormState<T>) => boolean
): boolean {
  return condition(state);
}

/**
 * Clears dependent fields when condition changes
 */
export function clearDependentFields<T extends Record<string, any>>(
  state: FormState<T>,
  fields: FormField<T>[]
): FormState<T> {
  let newState = { ...state };

  for (const field of fields) {
    newState = clearFormField(newState, field);
  }

  return newState;
}

// ============================================================================
// FORM STATE CLONING
// ============================================================================

/**
 * Deep clones form state
 */
export function cloneFormState<T extends Record<string, any>>(
  state: FormState<T>
): FormState<T> {
  return JSON.parse(JSON.stringify(state));
}

// ============================================================================
// DEBUGGING HELPERS
// ============================================================================

/**
 * Logs form state changes (development only)
 */
export function logFormStateChanges<T extends Record<string, any>>(
  label: string,
  previousState: FormState<T>,
  newState: FormState<T>
): void {
  if (process.env.NODE_ENV === 'development') {
    const changes = getChangedFields(newState, previousState);
    if (Object.keys(changes).length > 0) {
      console.group(`[Form State] ${label}`);
      console.log('Changed fields:', changes);
      console.log('Full state:', newState);
      console.groupEnd();
    }
  }
}

/**
 * Validates form state structure (development helper)
 */
export function validateFormStateStructure<T extends Record<string, any>>(
  state: FormState<T>,
  expectedFields: FormField<T>[]
): { isValid: boolean; missingFields: FormField<T>[] } {
  const stateKeys = Object.keys(state) as FormField<T>[];
  const missingFields = expectedFields.filter((field) => !stateKeys.includes(field));

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}
