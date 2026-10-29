import { relations } from 'drizzle-orm';
import {
  users,
  groups,
  accounts,
  transactions,
  budgets,
  budgetPeriods,
  recurringTransactions,
  categories,
  investments,
  userPreferences,
  groupInvitations,
} from './schema';

export const usersRelations = relations(users, ({ one, many }) => ({
  group: one(groups, { fields: [users.group_id], references: [groups.id] }),
  defaultAccount: one(accounts, {
    fields: [users.default_account_id],
    references: [accounts.id],
  }),
  transactions: many(transactions),
  budgets: many(budgets),
  budgetPeriods: many(budgetPeriods),
  investments: many(investments),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.user_id],
  }),
}));

export const groupsRelations = relations(groups, ({ many }) => ({
  users: many(users),
  accounts: many(accounts),
  transactions: many(transactions),
  budgets: many(budgets),
  categories: many(categories),
  invitations: many(groupInvitations),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  group: one(groups, { fields: [accounts.group_id], references: [groups.id] }),
  transactions: many(transactions, { relationName: 'sourceAccount' }),
  incomingTransfers: many(transactions, { relationName: 'destinationAccount' }),
  recurringSeries: many(recurringTransactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.user_id], references: [users.id] }),
  group: one(groups, { fields: [transactions.group_id], references: [groups.id] }),
  account: one(accounts, {
    fields: [transactions.account_id],
    references: [accounts.id],
    relationName: 'sourceAccount',
  }),
  toAccount: one(accounts, {
    fields: [transactions.to_account_id],
    references: [accounts.id],
    relationName: 'destinationAccount',
  }),
  recurringSeries: one(recurringTransactions, {
    fields: [transactions.recurring_series_id],
    references: [recurringTransactions.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, { fields: [budgets.user_id], references: [users.id] }),
  group: one(groups, { fields: [budgets.group_id], references: [groups.id] }),
}));

export const budgetPeriodsRelations = relations(budgetPeriods, ({ one }) => ({
  user: one(users, { fields: [budgetPeriods.user_id], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ one }) => ({
  group: one(groups, { fields: [categories.group_id], references: [groups.id] }),
}));

export const recurringTransactionsRelations = relations(recurringTransactions, ({ one, many }) => ({
  account: one(accounts, {
    fields: [recurringTransactions.account_id],
    references: [accounts.id],
  }),
  generatedTransactions: many(transactions),
}));

export const investmentsRelations = relations(investments, ({ one }) => ({
  user: one(users, { fields: [investments.user_id], references: [users.id] }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, { fields: [userPreferences.user_id], references: [users.id] }),
}));

export const groupInvitationsRelations = relations(groupInvitations, ({ one }) => ({
  group: one(groups, { fields: [groupInvitations.group_id], references: [groups.id] }),
  invitedBy: one(users, {
    fields: [groupInvitations.invited_by_user_id],
    references: [users.id],
  }),
}));
