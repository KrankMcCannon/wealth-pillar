import type { Account, Transaction } from '@/lib/types';
import {
  isReserveAccount,
  isSpendableAccount,
  resolveAccountLiquidity,
} from '@/lib/utils/account-classification';
import { toCents } from '@/lib/utils/money';
import { computeBalanceDeltas } from '../use-cases/transactions/transaction-balance-delta.core';

export type MovementKind =
  | 'income'
  | 'expense'
  | 'split_transfer'
  | 'savings_transfer'
  | 'internal_transfer'
  | 'ignored';

/** Expense +, income − (same sign as budget spent). */
export interface LedgerLeg {
  userId: string;
  signedCents: number;
}

export interface Movement {
  kind: MovementKind;
  /** Household P&L: external income/expense only. Transfers are 0. */
  cashFlowCents: number;
  budgetLegs: LedgerLeg[];
  /** Per-person P&L. Savings transfers omitted. */
  cashLegs: LedgerLeg[];
  spendableDeltaCents: number;
  savingsDeltaCents: number;
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

function pushLeg(legs: LedgerLeg[], userId: string | null, signedCents: number): void {
  if (!userId || signedCents === 0) return;
  legs.push({ userId, signedCents });
}

function spendableDeltaCentsFor(tx: Transaction, accountMap: Map<string, Account>): number {
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
  return toCents(sum);
}

export function classifyTransferSavingsDeltaCents(
  source: Pick<Account, 'type' | 'liquidity'>,
  dest: Pick<Account, 'type' | 'liquidity'>,
  amountCents: number
): number {
  const from = resolveAccountLiquidity(source);
  const to = resolveAccountLiquidity(dest);
  if (from === 'spendable' && to === 'reserve') return amountCents;
  if (from === 'reserve' && to === 'spendable') return -amountCents;
  return 0;
}

function isSplitTransfer(
  source: Account,
  dest: Account,
  sourceActorId: string | null
): boolean {
  if (resolveAccountLiquidity(source) !== 'spendable') return false;
  if (resolveAccountLiquidity(dest) !== 'spendable') return false;
  const destExclusive = exclusiveUserId(dest);
  if (!destExclusive || !sourceActorId) return false;
  return sourceActorId !== destExclusive;
}

export function classifyMovement(
  tx: Transaction,
  accountMap: Map<string, Account>
): Movement {
  const amountCents = toCents(Number(tx.amount) || 0);
  const source = accountMap.get(tx.account_id);
  const dest = tx.to_account_id ? accountMap.get(tx.to_account_id) : undefined;
  const spendableDeltaCents = spendableDeltaCentsFor(tx, accountMap);
  const empty: Movement = {
    kind: 'ignored',
    cashFlowCents: 0,
    budgetLegs: [],
    cashLegs: [],
    spendableDeltaCents,
    savingsDeltaCents: 0,
    savingsUserId: null,
  };

  if (tx.type === 'income' || tx.type === 'expense') {
    const signedCents = tx.type === 'income' ? -amountCents : amountCents;
    const cashFlowCents = tx.type === 'income' ? amountCents : -amountCents;
    const legs: LedgerLeg[] = [];
    pushLeg(legs, tx.user_id, signedCents);
    return {
      kind: tx.type,
      cashFlowCents,
      budgetLegs: legs,
      cashLegs: legs,
      spendableDeltaCents,
      savingsDeltaCents: 0,
      savingsUserId: null,
    };
  }

  if (tx.type !== 'transfer') return empty;

  if (!source || !dest) return empty;

  const sourceUserId = sourceActorUserId(tx, source);
  const destUserId = exclusiveUserId(dest);
  const savingsDeltaCents = classifyTransferSavingsDeltaCents(source, dest, amountCents);

  if (savingsDeltaCents !== 0) {
    const savingsUserId = isShared(dest) ? sourceUserId : (destUserId ?? sourceUserId);
    const budgetLegs: LedgerLeg[] = [];
    pushLeg(budgetLegs, savingsUserId, savingsDeltaCents);
    return {
      kind: 'savings_transfer',
      cashFlowCents: 0,
      budgetLegs,
      cashLegs: [],
      spendableDeltaCents,
      savingsDeltaCents,
      savingsUserId,
    };
  }

  if (isSplitTransfer(source, dest, sourceUserId)) {
    const budgetLegs: LedgerLeg[] = [];
    const cashLegs: LedgerLeg[] = [];
    pushLeg(budgetLegs, sourceUserId, amountCents);
    pushLeg(budgetLegs, destUserId, -amountCents);
    pushLeg(cashLegs, sourceUserId, amountCents);
    pushLeg(cashLegs, destUserId, -amountCents);
    return {
      kind: 'split_transfer',
      cashFlowCents: 0,
      budgetLegs,
      cashLegs,
      spendableDeltaCents,
      savingsDeltaCents: 0,
      savingsUserId: null,
    };
  }

  return {
    kind: 'internal_transfer',
    cashFlowCents: 0,
    budgetLegs: [],
    cashLegs: [],
    spendableDeltaCents,
    savingsDeltaCents: 0,
    savingsUserId: null,
  };
}

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
