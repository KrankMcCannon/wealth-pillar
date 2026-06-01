/**
 * Canonical Drizzle schema — adopted in full from `drizzle-kit pull` of the live
 * Supabase database (see `src/server/db/drizzle/schema.ts` + `meta/0001_snapshot.json`).
 *
 * Fidelity rules:
 * - DB column names, types, nullability, defaults, indexes, foreign keys, check
 *   constraints, RLS policies and views are reproduced exactly as introspected, so
 *   `pnpm db:generate` diffs cleanly against the baseline snapshot.
 * - Only the TypeScript property keys are kept in snake_case (instead of the camelCase
 *   the introspection emits). The snapshot is keyed on DB column names, so this has no
 *   effect on generated migrations, but it preserves the app contract: every query
 *   result is consumed as snake_case (`transaction.user_id`) via `@/lib/types`.
 *
 * Known DB-level smells preserved on purpose (fixing them is a data migration, not a
 * schema-alignment task):
 * - `accounts.user_ids` / `groups.user_ids` default to `'{""}'` (array with one empty
 *   string) and `recurring_transactions.transaction_ids` defaults to `'{"RAY"}'`.
 */
import {
  pgTable,
  index,
  uniqueIndex,
  uuid,
  text,
  timestamp,
  foreignKey,
  pgPolicy,
  numeric,
  varchar,
  boolean,
  check,
  date,
  integer,
  jsonb,
  pgView,
  bigint,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const orphanUsers = pgTable(
  'orphan_users',
  {
    id: uuid().defaultRandom().notNull(),
    clerk_id: text('clerk_id').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_orphan_users_clerk_id').using(
      'btree',
      table.clerk_id.asc().nullsLast().op('text_ops')
    ),
    index('idx_orphan_users_created_at').using(
      'btree',
      table.created_at.asc().nullsLast().op('timestamptz_ops')
    ),
  ]
).enableRLS();

export const investments = pgTable(
  'investments',
  {
    id: uuid().defaultRandom().notNull(),
    user_id: uuid('user_id').notNull(),
    name: text().notNull(),
    symbol: text().notNull(),
    amount: numeric({ precision: 15, scale: 2 }).notNull(),
    shares_acquired: numeric('shares_acquired', { precision: 15, scale: 6 }).notNull(),
    currency: varchar({ length: 3 }).notNull(),
    currency_rate: numeric('currency_rate', { precision: 10, scale: 6 }).default('1.0').notNull(),
    tax_paid: numeric('tax_paid', { precision: 15, scale: 2 }).default('0.0').notNull(),
    net_earn: numeric('net_earn', { precision: 15, scale: 2 }).default('0.0').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_investments_symbol').using('btree', table.symbol.asc().nullsLast().op('text_ops')),
    index('idx_investments_user_id').using('btree', table.user_id.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.user_id],
      foreignColumns: [users.id],
      name: 'investments_user_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Users can view their own investments', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`((auth.uid())::text = ( SELECT users.clerk_id
   FROM users
  WHERE (users.id = investments.user_id)))`,
    }),
    pgPolicy('Users can insert their own investments', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
    }),
    pgPolicy('Users can update their own investments', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can delete their own investments', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
    }),
  ]
);

export const userPreferences = pgTable(
  'user_preferences',
  {
    id: uuid().defaultRandom().notNull(),
    user_id: uuid('user_id').notNull(),
    currency: varchar({ length: 3 }).default('EUR').notNull(),
    language: varchar({ length: 5 }).default('it-IT').notNull(),
    timezone: varchar({ length: 50 }).default('Europe/Rome').notNull(),
    notifications_push: boolean('notifications_push').default(true).notNull(),
    notifications_email: boolean('notifications_email').default(false).notNull(),
    notifications_budget_alerts: boolean('notifications_budget_alerts').default(true).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_user_preferences_user_id').using(
      'btree',
      table.user_id.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.user_id],
      foreignColumns: [users.id],
      name: 'user_preferences_user_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Users can view their own preferences', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`((auth.uid())::text IN ( SELECT users.clerk_id
   FROM users
  WHERE (users.id = user_preferences.user_id)))`,
    }),
    pgPolicy('Users can update their own preferences', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can insert their own preferences', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
    }),
  ]
);

export const transactions = pgTable(
  'transactions',
  {
    id: uuid()
      .default(sql`extensions.uuid_generate_v4()`)
      .notNull(),
    description: text().notNull(),
    amount: numeric({ precision: 15, scale: 2 }).notNull(),
    type: varchar({ length: 10 }).notNull(),
    category: varchar({ length: 255 }).notNull(),
    date: date().notNull(),
    account_id: uuid('account_id').notNull(),
    to_account_id: uuid('to_account_id'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    user_id: uuid('user_id'),
    group_id: uuid('group_id'),
    recurring_series_id: uuid('recurring_series_id'),
    frequency: varchar({ length: 20 }),
  },
  (table) => [
    index('idx_transactions_account_date').using(
      'btree',
      table.account_id.asc().nullsLast().op('date_ops'),
      table.date.desc().nullsFirst().op('uuid_ops')
    ),
    index('idx_transactions_account_id').using(
      'btree',
      table.account_id.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_transactions_amount').using(
      'btree',
      table.amount.asc().nullsLast().op('numeric_ops')
    ),
    index('idx_transactions_category').using(
      'btree',
      table.category.asc().nullsLast().op('text_ops')
    ),
    index('idx_transactions_date').using('btree', table.date.asc().nullsLast().op('date_ops')),
    index('idx_transactions_description').using(
      'gin',
      sql`to_tsvector('italian'::regconfig, description)`
    ),
    index('idx_transactions_group_id').using(
      'btree',
      table.group_id.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_transactions_recurring_series_id').using(
      'btree',
      table.recurring_series_id.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_transactions_to_account_id').using(
      'btree',
      table.to_account_id.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_transactions_type').using('btree', table.type.asc().nullsLast().op('text_ops')),
    index('idx_transactions_user_category').using(
      'btree',
      table.user_id.asc().nullsLast().op('text_ops'),
      table.category.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_transactions_user_date').using(
      'btree',
      table.user_id.asc().nullsLast().op('uuid_ops'),
      table.date.desc().nullsFirst().op('uuid_ops')
    ),
    index('idx_transactions_user_id').using(
      'btree',
      table.user_id.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_transactions_user_type').using(
      'btree',
      table.user_id.asc().nullsLast().op('text_ops'),
      table.type.asc().nullsLast().op('text_ops')
    ),
    index('transactions_description_trgm_idx').using(
      'gin',
      table.description.asc().nullsLast().op('gin_trgm_ops')
    ),
    index('transactions_group_account_idx').using(
      'btree',
      table.group_id.asc().nullsLast().op('uuid_ops'),
      table.account_id.asc().nullsLast().op('uuid_ops')
    ),
    index('transactions_group_category_idx').using(
      'btree',
      table.group_id.asc().nullsLast().op('uuid_ops'),
      table.category.asc().nullsLast().op('uuid_ops')
    ),
    index('transactions_group_date_created_id_idx').using(
      'btree',
      table.group_id.asc().nullsLast().op('date_ops'),
      table.date.desc().nullsFirst().op('date_ops'),
      table.created_at.desc().nullsFirst().op('uuid_ops'),
      table.id.desc().nullsFirst().op('uuid_ops')
    ),
    index('transactions_group_type_idx').using(
      'btree',
      table.group_id.asc().nullsLast().op('text_ops'),
      table.type.asc().nullsLast().op('text_ops')
    ),
    index('transactions_group_user_idx').using(
      'btree',
      table.group_id.asc().nullsLast().op('uuid_ops'),
      table.user_id.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.group_id],
      foreignColumns: [groups.id],
      name: 'fk_transactions_group_id',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.recurring_series_id],
      foreignColumns: [recurringTransactions.id],
      name: 'fk_transactions_recurring_series_id',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.user_id],
      foreignColumns: [users.id],
      name: 'fk_transactions_user_id',
    }).onDelete('cascade'),
    pgPolicy('Allow all operations on transactions', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`true`,
    }),
    pgPolicy('Users can view their own transactions and group transactions', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
    pgPolicy('Users can create their own transactions', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
    }),
    pgPolicy('Users can update their own transactions', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can delete their own transactions', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
    }),
    check(
      'transactions_frequency_check',
      sql`(frequency)::text = ANY ((ARRAY['once'::character varying, 'weekly'::character varying, 'biweekly'::character varying, 'monthly'::character varying, 'yearly'::character varying])::text[])`
    ),
    check(
      'transactions_type_check',
      sql`(type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying, 'transfer'::character varying])::text[])`
    ),
  ]
);

export const users = pgTable(
  'users',
  {
    id: uuid().defaultRandom().notNull(),
    clerk_id: text('clerk_id'),
    name: text().notNull(),
    email: text().notNull(),
    avatar: text().default(''),
    theme_color: text('theme_color').default('#3B82F6'),
    budget_start_date: integer('budget_start_date').default(1),
    group_id: uuid('group_id'),
    role: text().default('member'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    default_account_id: uuid('default_account_id'),
  },
  (table) => [
    index('idx_users_clerk_id').using('btree', table.clerk_id.asc().nullsLast().op('text_ops')),
    index('idx_users_email').using('btree', table.email.asc().nullsLast().op('text_ops')),
    index('idx_users_group_id').using('btree', table.group_id.asc().nullsLast().op('uuid_ops')),
    index('idx_users_role').using('btree', table.role.asc().nullsLast().op('text_ops')),
    foreignKey({
      columns: [table.default_account_id],
      foreignColumns: [accounts.id],
      name: 'users_default_account_id_fkey',
    }).onDelete('set null'),
    pgPolicy('Users can view users in their group', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`(group_id IN ( SELECT users_1.group_id
   FROM users users_1
  WHERE (users_1.clerk_id = (auth.jwt() ->> 'sub'::text))))`,
    }),
    pgPolicy('Users can update their own record', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Superadmins can insert users', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('Superadmins can delete users', { as: 'permissive', for: 'delete', to: ['public'] }),
    check(
      'users_budget_start_date_check',
      sql`(budget_start_date >= 1) AND (budget_start_date <= 31)`
    ),
    check(
      'users_role_check',
      sql`role = ANY (ARRAY['superadmin'::text, 'admin'::text, 'member'::text])`
    ),
  ]
);

export const accounts = pgTable(
  'accounts',
  {
    id: uuid().defaultRandom().notNull(),
    name: text().notNull(),
    type: text().notNull(),
    user_ids: uuid('user_ids').array().default(['']).notNull(),
    group_id: uuid('group_id').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    balance: numeric({ precision: 12, scale: 2 }).default('0'),
    liquidity: text(),
  },
  (table) => [
    index('idx_accounts_group_id').using('btree', table.group_id.asc().nullsLast().op('uuid_ops')),
    index('idx_accounts_type').using('btree', table.type.asc().nullsLast().op('text_ops')),
    index('idx_accounts_user_ids').using('gin', table.user_ids.asc().nullsLast().op('array_ops')),
    pgPolicy('Users can view their accounts', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`(EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.clerk_id = (auth.jwt() ->> 'sub'::text)) AND ((u.id = ANY (accounts.user_ids)) OR (u.group_id = accounts.group_id)))))`,
    }),
    pgPolicy('Users can update their accounts', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can create accounts in their group', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
    }),
    pgPolicy('Users can delete their accounts', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
    }),
    check(
      'accounts_type_check',
      sql`type = ANY (ARRAY['payroll'::text, 'savings'::text, 'cash'::text, 'investments'::text])`
    ),
  ]
);

export const budgets = pgTable(
  'budgets',
  {
    id: uuid().defaultRandom().notNull(),
    description: text().notNull(),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    type: text().default('monthly').notNull(),
    icon: text(),
    categories: jsonb().default([]).notNull(),
    user_id: uuid('user_id').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    group_id: uuid('group_id'),
  },
  (table) => [
    index('idx_budgets_amount').using('btree', table.amount.asc().nullsLast().op('numeric_ops')),
    index('idx_budgets_categories').using(
      'gin',
      table.categories.asc().nullsLast().op('jsonb_ops')
    ),
    index('idx_budgets_type').using('btree', table.type.asc().nullsLast().op('text_ops')),
    index('idx_budgets_user_id').using('btree', table.user_id.asc().nullsLast().op('uuid_ops')),
    pgPolicy('Users can view their own budgets', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`(user_id IN ( SELECT users.id
   FROM users
  WHERE (users.clerk_id = (auth.jwt() ->> 'sub'::text))))`,
    }),
    pgPolicy('Users can update their own budgets', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can create their own budgets', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
    }),
    pgPolicy('Users can delete their own budgets', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
    }),
    check('budgets_amount_check', sql`amount >= (0)::numeric`),
    check('budgets_type_check', sql`type = ANY (ARRAY['monthly'::text, 'annually'::text])`),
  ]
);

export const categories = pgTable(
  'categories',
  {
    id: uuid().defaultRandom().notNull(),
    key: text().notNull(),
    label: text().notNull(),
    icon: text().notNull(),
    color: text().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    group_id: uuid('group_id').notNull(),
  },
  (table) => [
    index('idx_categories_group_id').using(
      'btree',
      table.group_id.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_categories_key').using('btree', table.key.asc().nullsLast().op('text_ops')),
    uniqueIndex('idx_categories_key_unique').using(
      'btree',
      table.key.asc().nullsLast().op('text_ops')
    ),
    index('idx_categories_label').using('btree', table.label.asc().nullsLast().op('text_ops')),
    foreignKey({
      columns: [table.group_id],
      foreignColumns: [groups.id],
      name: 'categories_group_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Categories are readable by all authenticated users', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
      using: sql`true`,
    }),
    pgPolicy('Only admins can modify categories', { as: 'permissive', for: 'all', to: ['public'] }),
  ]
);

export const groupInvitations = pgTable(
  'group_invitations',
  {
    id: uuid().defaultRandom().notNull(),
    group_id: uuid('group_id').notNull(),
    invited_by_user_id: uuid('invited_by_user_id').notNull(),
    email: varchar({ length: 255 }).notNull(),
    status: varchar({ length: 20 }).default('pending').notNull(),
    invitation_token: varchar('invitation_token', { length: 255 }).notNull(),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    accepted_at: timestamp('accepted_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_group_invitations_email').using(
      'btree',
      table.email.asc().nullsLast().op('text_ops')
    ),
    index('idx_group_invitations_email_group_status').using(
      'btree',
      table.email.asc().nullsLast().op('text_ops'),
      table.group_id.asc().nullsLast().op('text_ops'),
      table.status.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_group_invitations_group_id').using(
      'btree',
      table.group_id.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_group_invitations_status').using(
      'btree',
      table.status.asc().nullsLast().op('text_ops')
    ),
    index('idx_group_invitations_token').using(
      'btree',
      table.invitation_token.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.group_id],
      foreignColumns: [groups.id],
      name: 'group_invitations_group_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.invited_by_user_id],
      foreignColumns: [users.id],
      name: 'group_invitations_invited_by_user_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Group members can view their group invitations', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`(group_id IN ( SELECT users.group_id
   FROM users
  WHERE (users.clerk_id = (auth.uid())::text)))`,
    }),
    pgPolicy('Group admins can create invitations', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
    }),
    pgPolicy('Group admins can update invitations', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Group admins can delete invitations', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
    }),
    check(
      'check_email_format',
      sql`(email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'::text`
    ),
    check(
      'check_status',
      sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[])`
    ),
  ]
);

export const marketDataCache = pgTable(
  'market_data_cache',
  {
    symbol: text().notNull(),
    data: jsonb().default([]).notNull(),
    last_updated: timestamp('last_updated', { precision: 6, withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index('idx_market_data_last_updated').using(
      'btree',
      table.last_updated.asc().nullsLast().op('timestamptz_ops')
    ),
  ]
).enableRLS();

export const recurringTransactions = pgTable(
  'recurring_transactions',
  {
    id: uuid().defaultRandom().notNull(),
    description: text().notNull(),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    type: varchar({ length: 50 }).notNull(),
    account_id: uuid('account_id').notNull(),
    start_date: date('start_date').notNull(),
    end_date: date('end_date'),
    frequency: varchar({ length: 20 }).notNull(),
    is_active: boolean('is_active').default(true).notNull(),
    total_executions: integer('total_executions').default(0).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`),
    category: text().notNull(),
    transaction_ids: uuid('transaction_ids').array().default(['RAY']).notNull(),
    due_day: integer('due_day').default(1).notNull(),
    user_ids: text('user_ids').array().notNull(),
  },
  (table) => [
    index('idx_recurring_transactions_account_id').using(
      'btree',
      table.account_id.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_recurring_transactions_frequency').using(
      'btree',
      table.frequency.asc().nullsLast().op('text_ops')
    ),
    index('idx_recurring_transactions_is_active').using(
      'btree',
      table.is_active.asc().nullsLast().op('bool_ops')
    ),
    index('idx_recurring_transactions_user_ids').using(
      'gin',
      table.user_ids.asc().nullsLast().op('array_ops')
    ),
    foreignKey({
      columns: [table.account_id],
      foreignColumns: [accounts.id],
      name: 'recurring_transactions_account_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Users can view their associated recurring transactions', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`((auth.uid())::text = ANY (user_ids))`,
    }),
    pgPolicy('Users can create recurring transactions for themselves', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
    }),
    pgPolicy('Users can update their associated recurring transactions', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can delete their associated recurring transactions', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
    }),
    check('due_day_range', sql`(due_day >= 1) AND (due_day <= 31)`),
    check(
      'recurring_transactions_frequency_check',
      sql`(frequency)::text = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'monthly'::character varying, 'quarterly'::character varying, 'yearly'::character varying])::text[])`
    ),
    check(
      'recurring_transactions_type_check',
      sql`(type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying, 'transfer'::character varying])::text[])`
    ),
  ]
);

export const groups = pgTable(
  'groups',
  {
    id: uuid().defaultRandom().notNull(),
    name: text().notNull(),
    description: text(),
    user_ids: uuid('user_ids').array().default(['']).notNull(),
    plan: jsonb().default({ name: 'Piano Gratuito', type: 'free' }).notNull(),
    is_active: boolean('is_active').default(true).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    subscription_status: varchar('subscription_status', { length: 20 }).default('free'),
    subscription_expires_at: timestamp('subscription_expires_at', {
      withTimezone: true,
    }),
    stripe_customer_id: varchar('stripe_customer_id', { length: 255 }),
    stripe_subscription_id: varchar('stripe_subscription_id', { length: 255 }),
  },
  (table) => [
    index('idx_groups_is_active').using('btree', table.is_active.asc().nullsLast().op('bool_ops')),
    index('idx_groups_plan').using('gin', table.plan.asc().nullsLast().op('jsonb_ops')),
    index('idx_groups_stripe_customer_id')
      .using('btree', table.stripe_customer_id.asc().nullsLast().op('text_ops'))
      .where(sql`(stripe_customer_id IS NOT NULL)`),
    index('idx_groups_stripe_subscription_id')
      .using('btree', table.stripe_subscription_id.asc().nullsLast().op('text_ops'))
      .where(sql`(stripe_subscription_id IS NOT NULL)`),
    index('idx_groups_subscription_status').using(
      'btree',
      table.subscription_status.asc().nullsLast().op('text_ops')
    ),
    index('idx_groups_user_ids').using('gin', table.user_ids.asc().nullsLast().op('array_ops')),
    pgPolicy('Users can view their groups', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`(EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.clerk_id = (auth.jwt() ->> 'sub'::text)) AND (u.id = ANY (groups.user_ids)))))`,
    }),
    pgPolicy('Admins can update their groups', { as: 'permissive', for: 'update', to: ['public'] }),
    pgPolicy('Superadmins can create groups', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('Superadmins can delete groups', { as: 'permissive', for: 'delete', to: ['public'] }),
    check(
      'check_subscription_status',
      sql`(subscription_status)::text = ANY ((ARRAY['free'::character varying, 'active'::character varying, 'cancelled'::character varying, 'past_due'::character varying, 'unpaid'::character varying])::text[])`
    ),
  ]
);

export const availableShares = pgTable(
  'available_shares',
  {
    id: uuid().defaultRandom().notNull(),
    symbol: varchar({ length: 20 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    region: varchar({ length: 50 }).notNull(),
    asset_type: varchar('asset_type', { length: 50 }).notNull(),
    exchange: varchar({ length: 50 }),
    currency: varchar({ length: 10 }),
    is_popular: boolean('is_popular').default(false),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_available_shares_asset_type').using(
      'btree',
      table.asset_type.asc().nullsLast().op('text_ops')
    ),
    index('idx_available_shares_is_popular')
      .using('btree', table.is_popular.asc().nullsLast().op('bool_ops'))
      .where(sql`(is_popular = true)`),
    index('idx_available_shares_region').using(
      'btree',
      table.region.asc().nullsLast().op('text_ops')
    ),
    index('idx_available_shares_region_type').using(
      'btree',
      table.region.asc().nullsLast().op('text_ops'),
      table.asset_type.asc().nullsLast().op('text_ops')
    ),
  ]
).enableRLS();

export const budgetPeriods = pgTable(
  'budget_periods',
  {
    id: uuid().defaultRandom().notNull(),
    user_id: uuid('user_id').notNull(),
    start_date: date('start_date').notNull(),
    end_date: date('end_date'),
    is_active: boolean('is_active').default(false),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    group_id: uuid('group_id'),
    spendable_spent: numeric('spendable_spent'),
    reserve_saved: numeric('reserve_saved'),
    category_spending: jsonb('category_spending').default({}),
    snapshot_at: timestamp('snapshot_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_budget_periods_active')
      .using('btree', table.user_id.asc().nullsLast().op('uuid_ops'))
      .where(sql`(is_active = true)`),
    index('idx_budget_periods_group_id').using(
      'btree',
      table.group_id.asc().nullsLast().op('uuid_ops')
    ),
    uniqueIndex('idx_budget_periods_one_active_per_user')
      .using('btree', table.user_id.asc().nullsLast().op('uuid_ops'))
      .where(sql`(is_active = true)`),
    index('idx_budget_periods_start_date').using(
      'btree',
      table.start_date.asc().nullsLast().op('date_ops')
    ),
    index('idx_budget_periods_user_id').using(
      'btree',
      table.user_id.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_budget_periods_user_start').using(
      'btree',
      table.user_id.asc().nullsLast().op('date_ops'),
      table.start_date.desc().nullsFirst().op('date_ops')
    ),
    foreignKey({
      columns: [table.user_id],
      foreignColumns: [users.id],
      name: 'budget_periods_user_id_fkey',
    }).onDelete('cascade'),
  ]
).enableRLS();

export const budgetAnalytics = pgView('budget_analytics', {
  user_name: text('user_name'),
  user_email: text('user_email'),
  description: text(),
  amount: numeric({ precision: 10, scale: 2 }),
  type: text(),
  category_count: integer('category_count'),
  created_at: timestamp('created_at', { withTimezone: true }),
  updated_at: timestamp('updated_at', { withTimezone: true }),
})
  .with({ securityInvoker: true })
  .as(
    sql`SELECT u.name AS user_name, u.email AS user_email, b.description, b.amount, b.type, jsonb_array_length(b.categories) AS category_count, b.created_at, b.updated_at FROM budgets b JOIN users u ON u.id = b.user_id`
  );

export const usersWithStats = pgView('users_with_stats', {
  id: uuid(),
  clerk_id: text('clerk_id'),
  name: text(),
  email: text(),
  avatar: text(),
  theme_color: text('theme_color'),
  budget_start_date: integer('budget_start_date'),
  group_id: uuid('group_id'),
  role: text(),
  created_at: timestamp('created_at', { withTimezone: true }),
  updated_at: timestamp('updated_at', { withTimezone: true }),
  total_budget_periods: integer('total_budget_periods'),
  active_budget_periods: integer('active_budget_periods'),
})
  .with({ securityInvoker: true })
  .as(
    sql`SELECT id, clerk_id, name, email, avatar, theme_color, budget_start_date, group_id, role, created_at, updated_at, ( SELECT count(*)::integer AS count FROM budget_periods bp WHERE bp.user_id = u.id) AS total_budget_periods, ( SELECT count(*)::integer AS count FROM budget_periods bp WHERE bp.user_id = u.id AND bp.is_active = true) AS active_budget_periods FROM users u`
  );

export const categoryUsageStats = pgView('category_usage_stats', {
  id: uuid(),
  key: text(),
  label: text(),
  icon: text(),
  color: text(),
  total_usage: bigint('total_usage', { mode: 'number' }),
  budget_usage: bigint('budget_usage', { mode: 'number' }),
  transaction_usage: bigint('transaction_usage', { mode: 'number' }),
})
  .with({ securityInvoker: true })
  .as(
    sql`WITH budget_categories AS ( SELECT jsonb_array_elements_text(budgets.categories) AS category_key FROM budgets ), transaction_categories AS ( SELECT transactions.category AS category_key FROM transactions WHERE transactions.category IS NOT NULL ) SELECT c.id, c.key, c.label, c.icon, c.color, COALESCE(budget_usage.usage_count, 0::bigint) + COALESCE(transaction_usage.usage_count, 0::bigint) AS total_usage, COALESCE(budget_usage.usage_count, 0::bigint) AS budget_usage, COALESCE(transaction_usage.usage_count, 0::bigint) AS transaction_usage FROM categories c LEFT JOIN ( SELECT budget_categories.category_key, count(*) AS usage_count FROM budget_categories GROUP BY budget_categories.category_key) budget_usage ON c.key = budget_usage.category_key LEFT JOIN ( SELECT transaction_categories.category_key, count(*) AS usage_count FROM transaction_categories GROUP BY transaction_categories.category_key) transaction_usage ON c.key = transaction_usage.category_key::text`
  );
