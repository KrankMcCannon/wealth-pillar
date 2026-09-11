import type { Account, DateString, Transaction } from '@/lib/types';
import { isReserveAccount, isSpendableAccount } from '@/lib/utils/account-classification';
import { roundMoney } from '@/lib/utils/money';
import { computeBalanceDeltas } from '../transactions/transaction-balance-delta.core';
import type { NetSavingsResult } from './savings.logic';
import { classifyTransferSavingsDelta } from './savings.logic';

interface DateWindow {
  start: Date;
  end: Date;
}

/** Expense +, income − (same sign as budget spent). */
export interface BudgetLeg {
  userId: string;
  signed: number;
}

export interface TransactionImpact {
  /** +income, −expense, 0 for transfers. Household net-flow uses this. */
  cashFlow: number;
  budgetLegs: BudgetLeg[];
  spendableDelta: number;
  savingsDelta: number;
  /** Source actor of a spendable↔reserve transfer; null when savingsDelta is 0. */
  savingsUserId: string | null;
}

export function accountsToMap(accounts: Account[]): Map<string, Account> {
  return new Map(accounts.map((account) => [account.id, account]));
}

function exclusiveUserId(account: Account | undefined): string | null {
  if (!account || account.user_ids.length !== 1) return null;
  return account.user_ids[0] ?? null;
}

function isShared(account: Account | undefined): boolean {
  return !!account && account.user_ids.length > 1;
}

function sourceActorUserId(tx: Transaction, source: Account | undefined): string | null {
  return exclusiveUserId(source) ?? tx.user_id;
}

function pushLeg(legs: BudgetLeg[], userId: string | null, signed: number): void {
  if (!userId) return;
  legs.push({ userId, signed });
}

function spendableDeltaFor(tx: Transaction, accountMap: Map<string, Account>): number {
  const deltas = computeBalanceDeltas(tx, 1);
  let sum = 0;
  for (const [accountId, delta] of deltas) {
    const account = accountMap.get(accountId);
    if (account) {
      if (isSpendableAccount(account)) sum += delta;
      continue;
    }
    if (tx.type !== 'transfer') sum += delta;
  }
  return roundMoney(sum);
}

export function computeTransactionImpact(
  tx: Transaction,
  accountMap: Map<string, Account>
): TransactionImpact {
  const amount = Number(tx.amount) || 0;
  const source = accountMap.get(tx.account_id);
  const dest = tx.to_account_id ? accountMap.get(tx.to_account_id) : undefined;
  const spendableDelta = spendableDeltaFor(tx, accountMap);

  if (tx.type === 'income' || tx.type === 'expense') {
    const signed = tx.type === 'income' ? -amount : amount;
    const cashFlow = tx.type === 'income' ? amount : -amount;
    const budgetLegs: BudgetLeg[] = [];
    pushLeg(budgetLegs, tx.user_id, signed);
    return {
      cashFlow,
      budgetLegs,
      spendableDelta,
      savingsDelta: 0,
      savingsUserId: null,
    };
  }

  if (tx.type !== 'transfer') {
    return {
      cashFlow: 0,
      budgetLegs: [],
      spendableDelta,
      savingsDelta: 0,
      savingsUserId: null,
    };
  }

  const sourceUserId = sourceActorUserId(tx, source);
  const destUserId = exclusiveUserId(dest);
  const budgetLegs: BudgetLeg[] = [];

  if (source || dest) {
    pushLeg(budgetLegs, sourceUserId, amount);
    if (destUserId) pushLeg(budgetLegs, destUserId, -amount);
  }

  const savingsDelta = source && dest ? classifyTransferSavingsDelta(source, dest, amount) : 0;
  let savingsUserId: string | null = null;
  if (savingsDelta !== 0) {
    savingsUserId = isShared(dest) ? sourceUserId : (destUserId ?? sourceUserId);
  }

  return {
    cashFlow: 0,
    budgetLegs,
    spendableDelta,
    savingsDelta,
    savingsUserId,
  };
}

export function budgetSignedForUser(
  tx: Transaction,
  accountMap: Map<string, Account>,
  userId: string
): number {
  return computeTransactionImpact(tx, accountMap)
    .budgetLegs.filter((leg) => leg.userId === userId)
    .reduce((sum, leg) => sum + leg.signed, 0);
}

export function foldBudgetSpent(
  transactions: Transaction[],
  accounts: Account[],
  userId?: string
): number {
  const accountMap = accountsToMap(accounts);
  let spent = 0;
  for (const tx of transactions) {
    const impact = computeTransactionImpact(tx, accountMap);
    if (userId) {
      for (const leg of impact.budgetLegs) {
        if (leg.userId === userId) spent += leg.signed;
      }
    } else {
      for (const leg of impact.budgetLegs) spent += leg.signed;
    }
  }
  return Math.max(0, roundMoney(spent));
}

/** Members of the reserve account(s) this transfer actually moved. Empty when savingsDelta is 0. */
export function reserveViewerIds(
  tx: Transaction,
  accountMap: Map<string, Account>
): string[] {
  const source = accountMap.get(tx.account_id);
  const dest = tx.to_account_id ? accountMap.get(tx.to_account_id) : undefined;
  const ids = new Set<string>();
  if (source && isReserveAccount(source)) {
    for (const id of source.user_ids) ids.add(id);
  }
  if (dest && isReserveAccount(dest)) {
    for (const id of dest.user_ids) ids.add(id);
  }
  return [...ids];
}

export function transactionInvolvesUser(
  tx: Transaction,
  userId: string,
  accounts: Account[]
): boolean {
  const impact = computeTransactionImpact(tx, accountsToMap(accounts));
  return impact.budgetLegs.some((leg) => leg.userId === userId) || tx.user_id === userId;
}

function isInWindow(date: DateString, window: DateWindow): boolean {
  const t = new Date(date).getTime();
  return t >= window.start.getTime() && t <= window.end.getTime();
}

export function computeNetSavings(
  transactions: Transaction[],
  accounts: Account[],
  window: DateWindow,
  userId?: string
): NetSavingsResult {
  const accountMap = accountsToMap(accounts);
  let deposits = 0;
  let withdrawals = 0;
  let count = 0;

  for (const tx of transactions) {
    if (!isInWindow(tx.date, window)) continue;
    const impact = computeTransactionImpact(tx, accountMap);
    if (impact.savingsDelta === 0) continue;
    if (userId !== undefined && impact.savingsUserId !== userId) continue;
    if (impact.savingsDelta > 0) deposits += impact.savingsDelta;
    else withdrawals += Math.abs(impact.savingsDelta);
    count += 1;
  }

  return {
    deposits: roundMoney(deposits),
    withdrawals: roundMoney(withdrawals),
    net: roundMoney(deposits - withdrawals),
    count,
  };
}
