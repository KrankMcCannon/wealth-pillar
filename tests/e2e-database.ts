import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
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
    // Playwright's CommonJS transform cannot load import.meta from the native
    // migration modules. Run the same migrator in a native Node ESM process.
    await promisify(execFile)(process.execPath, ['tests/e2e-migrate.mjs']);
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
        'DROP SCHEMA public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS auth CASCADE; DROP SCHEMA IF EXISTS extensions CASCADE; DROP SCHEMA IF EXISTS wealth_pillar_migrations CASCADE; DROP ROLE IF EXISTS anon; DROP ROLE IF EXISTS authenticated; DROP ROLE IF EXISTS service_role; DROP ROLE IF EXISTS pool_user;'
      );
    throw error;
  } finally {
    await db.end();
  }
}
