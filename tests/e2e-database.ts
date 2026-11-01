import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { requireE2EEnvironment } from './e2e-environment';

export function fixtureDatabase() {
  requireE2EEnvironment();
  return postgres(process.env.DATABASE_URL!, { prepare: false, max: 2, onnotice: () => {} });
}
export async function seedE2EDatabase(clerkId: string, email: string) {
  const db = fixtureDatabase();
  let ownsDatabase = false;
  try {
    const counts = await db<
      { count: number }[]
    >`select count(*)::int as count from pg_tables where schemaname = 'public'`;
    const count = counts[0]?.count;
    if (count !== 0) throw new Error('The disposable E2E database must be empty before setup');
    ownsDatabase = true;
    const ddl = execFileSync(
      'pnpm',
      ['exec', 'drizzle-kit', 'export', '--config', 'tests/drizzle.e2e.config.ts'],
      { encoding: 'utf8' }
    );
    // Preserve tables/checks/indexes/FKs; emulate Supabase auth helpers only in this local DB.
    const tables = [...ddl.matchAll(/CREATE TABLE "([^"]+)" \([\s\S]*?\n\);/g)];
    if (tables.length < 10) throw new Error('Schema export is incomplete');
    await db.unsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm;
      CREATE SCHEMA IF NOT EXISTS extensions;
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;
      CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;`);
    for (const [statement, name] of tables) {
      await db.unsafe(statement);
      if (statement.includes('"id"'))
        await db.unsafe(`CREATE UNIQUE INDEX "e2e_${name}_id" ON "${name}" (id)`);
    }
    // Views and policies are not exercised with the local table-owner connection.
    const statements = ddl.split(';').map((part) => part.trim());
    for (const statement of statements) {
      if (
        (statement.startsWith('ALTER TABLE') && statement.includes('ADD CONSTRAINT')) ||
        /^CREATE (UNIQUE )?INDEX/.test(statement)
      )
        await db.unsafe(statement);
    }
    await db.begin((tx) =>
      tx.unsafe(
        readFileSync('src/server/db/drizzle/20261101191621_account_balance_versions.sql', 'utf8')
      )
    );
    const groupId = randomUUID();
    const userId = randomUUID();
    const accountId = randomUUID();
    await db`insert into groups (id, name, user_ids) values (${groupId}, 'E2E Household', ${[userId]})`;
    await db`insert into users (id, clerk_id, name, email, group_id, role, budget_start_date) values (${userId}, ${clerkId}, 'E2E User', ${email}, ${groupId}, 'admin', 1)`;
    await db`insert into accounts (id,name,type,user_ids,group_id,balance,liquidity) values (${accountId},'E2E Account','payroll',${[userId]},${groupId},10000,'spendable')`;
    await db`update users set default_account_id = ${accountId} where id = ${userId}`;
    await db`insert into user_preferences (user_id) values (${userId})`;
    await db`insert into categories (id,key,label,icon,color,group_id) values (${randomUUID()},'e2e_food','E2E Food','ShoppingCart','#555555',${groupId})`;
    await db`insert into budgets (id,description,amount,type,categories,user_id,group_id) values (${randomUUID()},'E2E Food Budget',500,'monthly',${db.json(['e2e_food'])},${userId},${groupId})`;
    await db`insert into transactions (id,description,amount,type,category,date,account_id,user_id,group_id)
      select gen_random_uuid(), 'E2E Seed ' || n, 1, 'expense', 'e2e_food', CURRENT_DATE, ${accountId}, ${userId}, ${groupId} from generate_series(1, 120) n`;
    await db`insert into recurring_transactions (id,description,amount,type,category,account_id,user_ids,start_date,frequency,transaction_ids)
      values (${randomUUID()},'E2E Recurring',10,'expense','e2e_food',${accountId},${[userId]},CURRENT_DATE,'monthly',${[]})`;
    await db`insert into budget_periods (id,user_id,start_date,end_date,is_active,budgets_snapshot)
      values (${randomUUID()},${userId},CURRENT_DATE - 60,CURRENT_DATE - 31,false,'[]'::jsonb),
      (${randomUUID()},${userId},CURRENT_DATE - 30,NULL,true,NULL)`;
    await db`insert into market_data_cache (symbol,data,last_updated) values ('IVV',${db.json([{ datetime: new Date().toISOString().slice(0, 10), close: '100' }])},now())`;
    return { groupId, userId, accountId, email };
  } catch (error) {
    if (ownsDatabase)
      await db.unsafe(
        'DROP SCHEMA public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS auth CASCADE;'
      );
    throw error;
  } finally {
    await db.end();
  }
}
