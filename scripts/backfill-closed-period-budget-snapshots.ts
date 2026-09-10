/**
 * One-shot: copy each user's current live envelopes onto closed periods
 * whose budgets_snapshot is null or []. Does not touch open periods or
 * snapshots that already have envelopes.
 *
 *   pnpm exec tsx --env-file=.env scripts/backfill-closed-period-budget-snapshots.ts
 */
import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env' });

const BUDGET_TYPES = new Set(['monthly', 'annually']);

function asIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return typeof value === 'string' ? value : '';
}

function needsLiveCopy(raw: unknown): boolean {
  if (raw == null) return true;
  return Array.isArray(raw) && raw.length === 0;
}

function toSnapshotItem(row: Record<string, unknown>): postgres.JSONValue | null {
  const type = typeof row.type === 'string' ? row.type : '';
  if (!BUDGET_TYPES.has(type)) return null;
  const categories = Array.isArray(row.categories)
    ? row.categories.filter((key): key is string => typeof key === 'string' && key.length > 0)
    : [];
  return {
    id: String(row.id ?? ''),
    description: String(row.description ?? ''),
    amount: Number(row.amount),
    type,
    icon: typeof row.icon === 'string' ? row.icon : null,
    categories,
    user_id: String(row.user_id ?? ''),
    group_id: row.group_id == null ? '' : String(row.group_id),
    created_at: asIso(row.created_at),
    updated_at: asIso(row.updated_at),
  };
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const sql = postgres(url, { prepare: false, max: 1 });
  try {
    const periods = await sql<
      { id: string; user_id: string; start_date: string; budgets_snapshot: unknown }[]
    >`
      SELECT id, user_id, start_date, budgets_snapshot
      FROM budget_periods
      WHERE end_date IS NOT NULL
    `;

    const targets = periods.filter((period) => needsLiveCopy(period.budgets_snapshot));
    const userIds = [...new Set(targets.map((period) => period.user_id))];
    const liveByUser = new Map<string, postgres.JSONValue[]>();

    for (const userId of userIds) {
      const rows = await sql<Record<string, unknown>[]>`
        SELECT id, description, amount, type, icon, categories, user_id, group_id, created_at, updated_at
        FROM budgets
        WHERE user_id = ${userId}
      `;
      liveByUser.set(
        userId,
        rows.map(toSnapshotItem).filter((row): row is postgres.JSONValue => row !== null)
      );
    }

    let updated = 0;
    for (const period of targets) {
      const snapshot: postgres.JSONValue = liveByUser.get(period.user_id) ?? [];
      await sql`
        UPDATE budget_periods
        SET budgets_snapshot = ${sql.json(snapshot)}, updated_at = now()
        WHERE id = ${period.id}
          AND end_date IS NOT NULL
          AND (budgets_snapshot IS NULL OR budgets_snapshot = '[]'::jsonb)
      `;
      updated += 1;
      console.log(
        `${period.start_date} ${period.id} user=${period.user_id} envelopes=${snapshot.length}`
      );
    }

    console.log(`updated ${updated} closed periods for ${userIds.length} users`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

void main();
