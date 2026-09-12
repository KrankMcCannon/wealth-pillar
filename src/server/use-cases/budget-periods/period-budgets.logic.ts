import type { Budget, BudgetPeriod } from '@/lib/types';
import { roundMoney } from '@/lib/utils/money';
import type { CreateBudgetInput } from '../budgets/types';

const BUDGET_TYPES = new Set(['monthly', 'annually']);

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseSnapshotItem(raw: unknown): Budget | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const id = asString(row.id).trim();
  const description = asString(row.description).trim();
  const userId = asString(row.user_id).trim();
  const type = asString(row.type);
  const amount = Number(row.amount);
  if (!id || !description || !userId || !BUDGET_TYPES.has(type) || !Number.isFinite(amount)) {
    return null;
  }
  const categories = Array.isArray(row.categories)
    ? row.categories.filter((key): key is string => typeof key === 'string' && key.length > 0)
    : [];
  return {
    id,
    description,
    amount,
    type: type as Budget['type'],
    icon: typeof row.icon === 'string' ? row.icon : null,
    categories,
    user_id: userId,
    group_id: asString(row.group_id),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
  };
}

/** null = column unset (no stored envelopes). [] = this period has no envelopes. */
export function parseBudgetsSnapshot(raw: unknown): Budget[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  return raw.map(parseSnapshotItem).filter((row): row is Budget => row !== null);
}

/** Closed period with no stored envelopes (null or []). Safe to seed from live once. */
export function snapshotNeedsLiveCopy(raw: unknown): boolean {
  const parsed = parseBudgetsSnapshot(raw);
  return parsed == null || parsed.length === 0;
}

export function toBudgetsSnapshot(budgets: Budget[]): Budget[] {
  return budgets.map((budget) => ({
    id: budget.id,
    description: budget.description,
    amount: Number(budget.amount),
    type: budget.type,
    icon: budget.icon ?? null,
    categories: [...budget.categories],
    user_id: budget.user_id,
    group_id: budget.group_id,
    created_at: budget.created_at,
    updated_at: budget.updated_at,
  }));
}

export function resolvePeriodBudgets(period: BudgetPeriod, liveBudgets: Budget[]): Budget[] {
  if (period.end_date == null) return liveBudgets;
  // Missing snapshot is empty history, not live rows. Restore JSON from backup/PITR only.
  return parseBudgetsSnapshot(period.budgets_snapshot) ?? [];
}

/** Closed-period editor base list. Missing snapshot is empty — never copy live. */
export function materializePeriodBudgets(period: BudgetPeriod): Budget[] {
  return parseBudgetsSnapshot(period.budgets_snapshot) ?? [];
}

export function allocatedFromBudgets(budgets: Budget[]): number {
  let total = 0;
  for (const budget of budgets) {
    if (budget.amount > 0) total += budget.amount;
  }
  return roundMoney(total);
}

export function categoryKeysFromBudgets(budgets: Budget[]): Set<string> {
  const cats = new Set<string>();
  for (const budget of budgets) {
    if (budget.amount <= 0) continue;
    for (const key of budget.categories) cats.add(key);
  }
  return cats;
}

export function upsertPeriodBudgetList(
  list: Budget[],
  input: CreateBudgetInput,
  budgetId?: string
): Budget[] {
  const now = new Date().toISOString();
  if (budgetId) {
    const index = list.findIndex((row) => row.id === budgetId);
    if (index < 0) return list;
    const next = [...list];
    const current = list[index]!;
    next[index] = {
      ...current,
      description: input.description,
      amount: input.amount,
      type: input.type,
      icon: input.icon ?? null,
      categories: [...input.categories],
      updated_at: now,
    };
    return next;
  }

  return [
    ...list,
    {
      id: crypto.randomUUID(),
      description: input.description,
      amount: input.amount,
      type: input.type,
      icon: input.icon ?? null,
      categories: [...input.categories],
      user_id: input.user_id,
      group_id: input.group_id ?? '',
      created_at: now,
      updated_at: now,
    },
  ];
}

export function deletePeriodBudgetList(list: Budget[], budgetId: string): Budget[] {
  return list.filter((row) => row.id !== budgetId);
}
