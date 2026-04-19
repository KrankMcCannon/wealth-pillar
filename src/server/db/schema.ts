import {
  pgTable,
  uuid,
  text,
  numeric,
  varchar,
  date,
  timestamp,
  jsonb,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerk_id: text('clerk_id').unique(),
  name: text('name'),
  email: text('email').unique(),
  group_id: uuid('group_id'),
  default_account_id: uuid('default_account_id'),
  avatar: text('avatar').default(''),
  theme_color: text('theme_color').default('#3B82F6'),
  budget_start_date: integer('budget_start_date').default(1),
  role: text('role').default('member'),
  budget_periods: jsonb('budget_periods').default([]),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  description: text('description'),
  user_ids: uuid('user_ids').array().default([]),
  is_active: boolean('is_active').default(true),
  subscription_status: varchar('subscription_status').default('free'),
  subscription_expires_at: timestamp('subscription_expires_at', { withTimezone: true }),
  stripe_customer_id: varchar('stripe_customer_id'),
  stripe_subscription_id: varchar('stripe_subscription_id'),
  plan: jsonb('plan').default({ name: 'Piano Gratuito', type: 'free' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  type: text('type'), // payroll, savings, cash, investments
  group_id: uuid('group_id'), // .references(() => groups.id)
  user_ids: uuid('user_ids').array().default([]),
  balance: numeric('balance').default('0'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  group_id: uuid('group_id'),
  key: text('key').unique(),
  label: text('label'),
  icon: text('icon'),
  color: text('color'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id')
    .primaryKey()
    .default(sql`extensions.uuid_generate_v4()`),
  description: text('description'),
  amount: numeric('amount'),
  type: varchar('type'), // income, expense, transfer
  category: varchar('category'),
  date: date('date'),
  account_id: uuid('account_id'), // .references(() => accounts.id)
  to_account_id: uuid('to_account_id'), // .references(() => accounts.id)
  user_id: uuid('user_id'), // .references(() => users.id)
  group_id: uuid('group_id'), // .references(() => groups.id)
  recurring_series_id: uuid('recurring_series_id'),
  frequency: varchar('frequency'), // once, weekly, etc.
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id'),
  group_id: uuid('group_id'),
  description: text('description'),
  amount: numeric('amount'),
  icon: text('icon'),
  type: text('type').default('monthly'),
  categories: jsonb('categories').default([]),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const budgetPeriods = pgTable('budget_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id'),
  start_date: date('start_date'),
  end_date: date('end_date'),
  is_active: boolean('is_active').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const recurringTransactions = pgTable('recurring_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  description: text('description').notNull(),
  amount: numeric('amount').notNull(),
  type: varchar('type').notNull(), // income, expense
  account_id: uuid('account_id').notNull(),
  start_date: date('start_date').notNull(),
  end_date: date('end_date'),
  frequency: varchar('frequency').notNull(), // weekly, monthly, etc.
  is_active: boolean('is_active').default(true).notNull(),
  total_executions: integer('total_executions').default(0).notNull(),
  category: varchar('category').notNull(),
  transaction_ids: uuid('transaction_ids').array().default([]).notNull(),
  due_day: integer('due_day').default(1).notNull(),
  user_ids: uuid('user_ids').array().default([]).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  currency: text('currency').default('EUR').notNull(),
  language: text('language').default('it').notNull(),
  timezone: text('timezone').default('Europe/Rome').notNull(),
  notifications_push: boolean('notifications_push').default(true).notNull(),
  notifications_email: boolean('notifications_email').default(true).notNull(),
  notifications_budget_alerts: boolean('notifications_budget_alerts').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const groupInvitations = pgTable('group_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  group_id: uuid('group_id').notNull(),
  invited_by_user_id: uuid('invited_by_user_id').notNull(),
  email: text('email').notNull(),
  status: text('status').default('pending').notNull(),
  invitation_token: text('invitation_token').notNull(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  accepted_at: timestamp('accepted_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const investments = pgTable('investments', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  amount: numeric('amount').notNull(),
  shares_acquired: numeric('shares_acquired').notNull(),
  currency: text('currency').notNull(),
  currency_rate: numeric('currency_rate').default('1').notNull(),
  tax_paid: numeric('tax_paid').default('0').notNull(),
  net_earn: numeric('net_earn').default('0').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const marketDataCache = pgTable('market_data_cache', {
  symbol: text('symbol').primaryKey(),
  data: jsonb('data').notNull(),
  last_updated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
});

export const availableShares = pgTable('available_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  region: text('region').notNull(),
  asset_type: text('asset_type').notNull(),
  exchange: text('exchange'),
  currency: text('currency'),
  is_popular: boolean('is_popular').default(false).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
