import type { BudgetPeriodJSON } from '@/lib/types';
import type { Json } from '@/lib/types/database.types';

/**
 * Type guard: checks if a value is a valid BudgetPeriodJSON object.
 * Use when reading user.budget_periods (Json) from the DB to get a typed array.
 */
function isBudgetPeriodJSON(value: unknown): value is BudgetPeriodJSON {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as Record<string, unknown>).id === 'string' &&
    'start_date' in value &&
    typeof (value as Record<string, unknown>).start_date === 'string' &&
    'end_date' in value &&
    ((value as Record<string, unknown>).end_date === null ||
      typeof (value as Record<string, unknown>).end_date === 'string') &&
    'is_active' in value &&
    typeof (value as Record<string, unknown>).is_active === 'boolean' &&
    'created_at' in value &&
    typeof (value as Record<string, unknown>).created_at === 'string' &&
    'updated_at' in value &&
    typeof (value as Record<string, unknown>).updated_at === 'string'
  );
}

/**
 * Parses user.budget_periods (Json | null) from the DB into a typed BudgetPeriodJSON[].
 * Filters out any invalid elements instead of casting blindly.
 */
export function parseBudgetPeriodsFromJson(value: Json | null): BudgetPeriodJSON[] {
  if (value == null) return [];
  if (!Array.isArray(value)) return [];
  const arr: unknown[] = value as unknown[];
  return arr.filter((item): item is BudgetPeriodJSON => isBudgetPeriodJSON(item));
}
