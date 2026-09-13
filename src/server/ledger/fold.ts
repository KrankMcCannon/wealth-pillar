import type { Account, DateString, Transaction } from '@/lib/types';
import { toDateTime } from '@/lib/utils/date-utils';
import { fromCents } from '@/lib/utils/money';
import { accountsToMap, classifyMovement, type LedgerLeg, type Movement } from './classify';

export interface DateWindow {
  start: Date;
  end: Date;
}

export interface NetSavingsResult {
  deposits: number;
  withdrawals: number;
  net: number;
  count: number;
}

/** Expense +, income − (euros, same sign as budget spent). */
export interface BudgetLeg {
  userId: string;
  signed: number;
}

export interface TransactionImpact {
  kind: Movement['kind'];
  /** +income, −expense, 0 for transfers. Household net-flow uses this. */
  cashFlow: number;
  budgetLegs: BudgetLeg[];
  /** Per-person P&L. Savings transfers omitted. */
  cashLegs: BudgetLeg[];
  spendableDelta: number;
  savingsDelta: number;
  savingsUserId: string | null;
}

function eurosLegs(legs: LedgerLeg[]): BudgetLeg[] {
  return legs.map((leg) => ({ userId: leg.userId, signed: fromCents(leg.signedCents) }));
}

export function computeTransactionImpact(
  tx: Transaction,
  accountMap: Map<string, Account>
): TransactionImpact {
  const movement = classifyMovement(tx, accountMap);
  return {
    kind: movement.kind,
    cashFlow: fromCents(movement.cashFlowCents),
    budgetLegs: eurosLegs(movement.budgetLegs),
    cashLegs: eurosLegs(movement.cashLegs),
    spendableDelta: fromCents(movement.spendableDeltaCents),
    savingsDelta: fromCents(movement.savingsDeltaCents),
    savingsUserId: movement.savingsUserId,
  };
}

export function budgetSignedForUser(
  tx: Transaction,
  accountMap: Map<string, Account>,
  userId: string
): number {
  return fromCents(
    classifyMovement(tx, accountMap)
      .budgetLegs.filter((leg) => leg.userId === userId)
      .reduce((sum, leg) => sum + leg.signedCents, 0)
  );
}

export function foldBudgetSpent(
  transactions: Transaction[],
  accounts: Account[],
  userId?: string
): number {
  const accountMap = accountsToMap(accounts);
  let spentCents = 0;
  for (const tx of transactions) {
    const movement = classifyMovement(tx, accountMap);
    for (const leg of movement.budgetLegs) {
      if (userId === undefined || leg.userId === userId) spentCents += leg.signedCents;
    }
  }
  return fromCents(Math.max(0, spentCents));
}

/** Per-category signed budget legs (income −). Does not floor; callers can hide zeros. */
export function foldBudgetCategorySpending(
  transactions: Transaction[],
  accounts: Account[],
  userId?: string
): Record<string, number> {
  const accountMap = accountsToMap(accounts);
  const cents: Record<string, number> = {};
  for (const tx of transactions) {
    let signedCents = 0;
    for (const leg of classifyMovement(tx, accountMap).budgetLegs) {
      if (userId === undefined || leg.userId === userId) signedCents += leg.signedCents;
    }
    if (signedCents === 0) continue;
    cents[tx.category] = (cents[tx.category] ?? 0) + signedCents;
  }
  const spending: Record<string, number> = {};
  for (const [key, value] of Object.entries(cents)) {
    const euros = fromCents(value);
    if (euros !== 0) spending[key] = euros;
  }
  return spending;
}

export function foldCashFlow(
  transactions: Transaction[],
  accounts: Account[],
  userId?: string
): { income: number; expenses: number } {
  const accountMap = accountsToMap(accounts);
  let incomeCents = 0;
  let expensesCents = 0;
  for (const tx of transactions) {
    const movement = classifyMovement(tx, accountMap);
    if (userId === undefined) {
      if (movement.cashFlowCents > 0) incomeCents += movement.cashFlowCents;
      else if (movement.cashFlowCents < 0) expensesCents += -movement.cashFlowCents;
      continue;
    }
    for (const leg of movement.cashLegs) {
      if (leg.userId !== userId) continue;
      if (leg.signedCents > 0) expensesCents += leg.signedCents;
      else if (leg.signedCents < 0) incomeCents += -leg.signedCents;
    }
  }
  return { income: fromCents(incomeCents), expenses: fromCents(expensesCents) };
}

export function transactionInvolvesUser(
  tx: Transaction,
  userId: string,
  accounts: Account[]
): boolean {
  const movement = classifyMovement(tx, accountsToMap(accounts));
  return (
    movement.budgetLegs.some((leg) => leg.userId === userId) ||
    movement.cashLegs.some((leg) => leg.userId === userId) ||
    tx.user_id === userId
  );
}

function isInWindow(date: DateString, window: DateWindow): boolean {
  const txDate = toDateTime(date);
  const start = toDateTime(window.start);
  const end = toDateTime(window.end);
  if (!txDate || !start || !end) return false;
  return txDate >= start && txDate <= end;
}

export function computeNetSavings(
  transactions: Transaction[],
  accounts: Account[],
  window: DateWindow,
  userId?: string
): NetSavingsResult {
  const accountMap = accountsToMap(accounts);
  let depositsCents = 0;
  let withdrawalsCents = 0;
  let count = 0;

  for (const tx of transactions) {
    if (!isInWindow(tx.date, window)) continue;
    const movement = classifyMovement(tx, accountMap);
    if (movement.savingsDeltaCents === 0) continue;
    if (userId !== undefined && movement.savingsUserId !== userId) continue;
    if (movement.savingsDeltaCents > 0) depositsCents += movement.savingsDeltaCents;
    else withdrawalsCents += Math.abs(movement.savingsDeltaCents);
    count += 1;
  }

  return {
    deposits: fromCents(depositsCents),
    withdrawals: fromCents(withdrawalsCents),
    net: fromCents(depositsCents - withdrawalsCents),
    count,
  };
}

export function foldPeriodAmounts(
  transactions: Transaction[],
  accounts: Account[],
  window: DateWindow,
  userId: string,
  categoryKeys?: Set<string>
): { spent: number; categorySpending: Record<string, number> } {
  const accountMap = accountsToMap(accounts);
  let spentCents = 0;
  const categorySpendingCents: Record<string, number> = {};

  for (const tx of transactions) {
    if (!isInWindow(tx.date, window)) continue;
    if (categoryKeys && !categoryKeys.has(tx.category)) continue;
    const signedCents = classifyMovement(tx, accountMap)
      .budgetLegs.filter((leg) => leg.userId === userId)
      .reduce((sum, leg) => sum + leg.signedCents, 0);
    if (signedCents === 0) continue;
    spentCents += signedCents;
    categorySpendingCents[tx.category] = (categorySpendingCents[tx.category] ?? 0) + signedCents;
  }

  const categorySpending: Record<string, number> = {};
  for (const [key, cents] of Object.entries(categorySpendingCents)) {
    categorySpending[key] = fromCents(cents);
  }

  return {
    spent: fromCents(Math.max(0, spentCents)),
    categorySpending,
  };
}
