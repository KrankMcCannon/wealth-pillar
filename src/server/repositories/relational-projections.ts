import { sql, getTableColumns } from 'drizzle-orm';
import { accounts, budgets, groups, recurringTransactions } from '@/server/db/schema';

/** Explicit compatibility switch for an application rollback during expansion. */
export const relationalReadsEnabled = () => process.env.DB_RELATIONAL_READS !== 'false';
export const accountReadColumns = () => ({
  ...getTableColumns(accounts),
  balance_version: sql<string>`accounts.balance_version::text`,
  ...(relationalReadsEnabled() && {
    user_ids: sql<
      string[]
    >`coalesce((select array_agg(x.user_id order by x.position) from account_users x where x.account_id=accounts.id), ARRAY[]::uuid[])`,
  }),
});
export const budgetReadColumns = () => ({
  ...getTableColumns(budgets),
  ...(relationalReadsEnabled() && {
    categories: sql<
      string[]
    >`coalesce((select jsonb_agg(x.category_key order by x.position) from budget_categories x where x.budget_id=budgets.id), '[]'::jsonb)`,
  }),
});
export const recurringReadColumns = () => ({
  ...getTableColumns(recurringTransactions),
  ...(relationalReadsEnabled() && {
    user_ids: sql<
      string[]
    >`coalesce((select array_agg(x.user_id::text order by x.position) from recurring_users x where x.recurring_id=recurring_transactions.id), ARRAY[]::text[])`,
  }),
});
export const groupReadColumns = () => ({
  ...getTableColumns(groups),
  ...(relationalReadsEnabled() && {
    user_ids: sql<
      string[]
    >`coalesce((select array_agg(u.id order by u.id) from users u where u.group_id=groups.id), ARRAY[]::uuid[])`,
  }),
});
