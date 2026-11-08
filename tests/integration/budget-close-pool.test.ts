import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db/drizzle';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { createBudgetPeriodUseCase } from '@/server/use-cases/budget-periods/create-budget-period.use-case';
import { closeBudgetPeriodUseCase } from '@/server/use-cases/budget-periods/close-budget-period.use-case';

vi.mock('next/cache', () => ({ unstable_cache: <T>(fn: T) => fn, revalidateTag: vi.fn() }));
const userId = '11111111-1111-4111-8111-111111111111';
const groupId = '22222222-2222-4222-8222-222222222222';
const tables = ['accounts', 'transactions', 'budgets', 'budget_periods', 'categories', 'users'];
beforeAll(async () => {
  const ddl = execFileSync(
    'pnpm',
    ['exec', 'drizzle-kit', 'export', '--config', 'tests/drizzle.e2e.config.ts'],
    { encoding: 'utf8' }
  );
  for (const table of tables) {
    const statement = [...ddl.matchAll(/CREATE TABLE "([^"]+)" \([\s\S]*?\n\);/g)].find(
      (match) => match[1] === table
    )?.[0];
    if (!statement) throw new Error(`Missing fixture table: ${table}`);
    await db.execute(
      sql.raw(statement.replaceAll('extensions.uuid_generate_v4()', 'gen_random_uuid()'))
    );
  }
  await db.execute(
    sql`INSERT INTO users (id, name, email, clerk_id, group_id, role) VALUES (${userId}, 'Fixture', 'fixture@example.test', 'fixture', ${groupId}, 'admin')`
  );
  await db.execute(
    sql`INSERT INTO categories (id, key, label, icon, color, group_id) VALUES (gen_random_uuid(), 'food', 'Food', 'Utensils', '#008800', ${groupId})`
  );
  const guard = readFileSync('src/server/db/drizzle/0008_category_reference_guards.sql', 'utf8')
    .split('--> statement-breakpoint')
    .find((part) => part.includes('CREATE FUNCTION public.guard_category_reference()'))!;
  await db.execute(sql.raw(guard));
  await db.execute(
    sql`CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON budget_periods FOR EACH ROW EXECUTE FUNCTION public.guard_category_reference()`
  );
  await db.execute(
    sql`INSERT INTO budgets (description, amount, type, categories, user_id, group_id) VALUES ('Food', 100, 'monthly', '["food"]', ${userId}, ${groupId})`
  );
});
afterAll(async () => {
  await db.execute(sql.raw(`DROP TABLE IF EXISTS ${tables.join(', ')} CASCADE`));
  await db.execute(sql`DROP FUNCTION public.guard_category_reference()`);
  await db.$client.end();
});
it.each([null, groupId])(
  'closes with one available connection, including legacy group %s',
  async (periodGroup) => {
    const period = await BudgetPeriodsRepository.create({
      user_id: userId,
      group_id: periodGroup,
      start_date: '2026-10-01',
      is_active: true,
    });
    const held = await Promise.all([db.$client.reserve(), db.$client.reserve()]);
    try {
      const result = await closeBudgetPeriodUseCase(userId, period.id, '2026-10-31');
      expect(result?.is_active).toBe(false);
      expect(result?.budgets_snapshot).toMatchObject([{ amount: 100, categories: ['food'] }]);
    } finally {
      held.forEach((connection) => connection.release());
    }
  },
  15_000
);

it('archives a legacy budget without deleting its unavailable category references', async () => {
  // This budget predates the reference guard, as in the observed production state.
  await db.execute(sql`UPDATE budgets SET categories='["food","legacy-category"]'`);
  const active = await BudgetPeriodsRepository.create({
    user_id: userId,
    group_id: groupId,
    start_date: '2026-11-01',
    is_active: true,
  });
  await expect(closeBudgetPeriodUseCase(userId, active.id, '2026-11-02')).rejects.toThrow();
  expect((await BudgetPeriodsRepository.findById(active.id))?.is_active).toBe(true);
  await expect(createBudgetPeriodUseCase(userId, '2026-11-03')).rejects.toThrow();
  await db.execute(
    sql.raw(
      readFileSync(
        'src/server/db/drizzle/20261108220000_budget_snapshot_legacy_categories.sql',
        'utf8'
      )
    )
  );
  const started = await createBudgetPeriodUseCase(userId, '2026-11-03');
  expect(started.is_active).toBe(true);
  const closed = await BudgetPeriodsRepository.findById(active.id);
  expect(closed?.end_date).toBe('2026-11-02');
  expect(closed?.budgets_snapshot).toMatchObject([{ categories: ['food', 'legacy-category'] }]);
  // Repeating the migration is safe and never validates arbitrary new references.
  await db.execute(
    sql.raw(
      readFileSync(
        'src/server/db/drizzle/20261108220000_budget_snapshot_legacy_categories.sql',
        'utf8'
      )
    )
  );
  await expect(
    BudgetPeriodsRepository.create({
      user_id: userId,
      group_id: groupId,
      start_date: '2026-11-03',
      is_active: false,
      budgets_snapshot: [{ id: 'invented', categories: ['invented-category'] }],
    })
  ).rejects.toThrow();
  await expect(
    BudgetPeriodsRepository.create({
      user_id: '33333333-3333-4333-8333-333333333333',
      group_id: groupId,
      start_date: '2026-11-03',
      is_active: false,
      budgets_snapshot: closed?.budgets_snapshot,
    })
  ).rejects.toThrow();
  await expect(
    BudgetPeriodsRepository.create({
      user_id: userId,
      group_id: '44444444-4444-4444-8444-444444444444',
      start_date: '2026-11-03',
      is_active: false,
      budgets_snapshot: closed?.budgets_snapshot,
    })
  ).rejects.toThrow();
  const legacyNullGroup = await BudgetPeriodsRepository.create({
    user_id: userId,
    group_id: null,
    start_date: '2026-09-01',
    is_active: false,
    budgets_snapshot: closed?.budgets_snapshot,
  });
  expect(legacyNullGroup.budgets_snapshot).toEqual(closed?.budgets_snapshot);
  await db.execute(
    sql.raw(
      readFileSync(
        'src/server/db/drizzle/rollback/20261108220000_budget_snapshot_legacy_categories.sql',
        'utf8'
      )
    )
  );
  await expect(createBudgetPeriodUseCase(userId, '2026-11-04')).rejects.toThrow();
  expect((await BudgetPeriodsRepository.findById(started.id))?.is_active).toBe(true);
});
