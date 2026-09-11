import type { Account, Transaction } from '@/lib/types';
import { describe, expect, it } from 'vitest';
import {
  accountsToMap,
  budgetSignedForUser,
  computeTransactionImpact,
  foldBudgetSpent,
  reserveViewerIds,
  transactionInvolvesUser,
} from './transaction-impact.logic';

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: 'a1',
    name: 'A',
    type: 'payroll',
    user_ids: ['alice'],
    group_id: 'g1',
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    description: '',
    amount: 100,
    type: 'expense',
    category: 'food',
    date: '2024-06-10',
    user_id: 'alice',
    account_id: 'a1',
    to_account_id: null,
    frequency: 'once',
    recurring_series_id: null,
    group_id: 'g1',
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

const alicePayroll = account({ id: 'a-alice', user_ids: ['alice'], type: 'payroll' });
const bobPayroll = account({ id: 'a-bob', user_ids: ['bob'], type: 'payroll' });
const jointSavings = account({
  id: 'a-joint-save',
  user_ids: ['alice', 'bob'],
  type: 'savings',
});
const jointChecking = account({
  id: 'a-joint',
  user_ids: ['alice', 'bob'],
  type: 'payroll',
});
const aliceSavings = account({ id: 'a-alice-save', user_ids: ['alice'], type: 'savings' });

describe('computeTransactionImpact', () => {
  it('P2P transfer: source expense, dest income, cashFlow 0', () => {
    const impact = computeTransactionImpact(
      tx({
        type: 'transfer',
        account_id: 'a-alice',
        to_account_id: 'a-bob',
        amount: 80,
      }),
      accountsToMap([alicePayroll, bobPayroll])
    );
    expect(impact.cashFlow).toBe(0);
    expect(impact.budgetLegs).toEqual([
      { userId: 'alice', signed: 80 },
      { userId: 'bob', signed: -80 },
    ]);
    expect(impact.spendableDelta).toBe(0);
  });

  it('dest-shared transfer: source only, like savings', () => {
    const impact = computeTransactionImpact(
      tx({
        type: 'transfer',
        account_id: 'a-alice',
        to_account_id: 'a-joint-save',
        amount: 50,
        category: 'savings',
      }),
      accountsToMap([alicePayroll, jointSavings])
    );
    expect(impact.budgetLegs).toEqual([{ userId: 'alice', signed: 50 }]);
    expect(impact.savingsDelta).toBe(50);
    expect(impact.savingsUserId).toBe('alice');
    expect(impact.cashFlow).toBe(0);
  });

  it('source-shared transfer uses recorder, not every source member', () => {
    const impact = computeTransactionImpact(
      tx({
        type: 'transfer',
        user_id: 'alice',
        account_id: 'a-joint',
        to_account_id: 'a-bob',
        amount: 40,
      }),
      accountsToMap([jointChecking, bobPayroll])
    );
    expect(impact.budgetLegs).toEqual([
      { userId: 'alice', signed: 40 },
      { userId: 'bob', signed: -40 },
    ]);
  });

  it('joint-account expense is recorder-only', () => {
    const impact = computeTransactionImpact(
      tx({ amount: 25, account_id: 'a-joint', user_id: 'alice' }),
      accountsToMap([jointChecking])
    );
    expect(impact.cashFlow).toBe(-25);
    expect(impact.budgetLegs).toEqual([{ userId: 'alice', signed: 25 }]);
  });

  it('household cash-flow ignores transfers', () => {
    const impact = computeTransactionImpact(
      tx({ type: 'transfer', account_id: 'a-alice', to_account_id: 'a-bob' }),
      accountsToMap([alicePayroll, bobPayroll])
    );
    expect(impact.cashFlow).toBe(0);
  });

  it('skips transfer budget legs when accounts are missing', () => {
    const impact = computeTransactionImpact(
      tx({ type: 'transfer', account_id: 'missing', to_account_id: 'also-missing' }),
      accountsToMap([])
    );
    expect(impact.budgetLegs).toEqual([]);
  });

  it('own exclusive savings nets to zero budget and still saves', () => {
    const impact = computeTransactionImpact(
      tx({
        type: 'transfer',
        account_id: 'a-alice',
        to_account_id: 'a-alice-save',
        amount: 70,
      }),
      accountsToMap([alicePayroll, aliceSavings])
    );
    expect(
      budgetSignedForUser(
        tx({
          type: 'transfer',
          account_id: 'a-alice',
          to_account_id: 'a-alice-save',
          amount: 70,
        }),
        accountsToMap([alicePayroll, aliceSavings]),
        'alice'
      )
    ).toBe(0);
    expect(impact.savingsDelta).toBe(70);
    expect(impact.savingsUserId).toBe('alice');
  });
});

describe('foldBudgetSpent', () => {
  it('group one-pass does not double a P2P transfer', () => {
    const rows = [
      tx({
        type: 'transfer',
        account_id: 'a-alice',
        to_account_id: 'a-bob',
        amount: 80,
      }),
    ];
    const accounts = [alicePayroll, bobPayroll];
    expect(foldBudgetSpent(rows, accounts)).toBe(0);
    expect(foldBudgetSpent(rows, accounts, 'alice')).toBe(80);
    expect(foldBudgetSpent(rows, accounts, 'bob')).toBe(0);
    expect(foldBudgetSpent(rows, accounts, 'alice') + foldBudgetSpent(rows, accounts, 'bob')).toBe(
      80
    );
  });
});

describe('transactionInvolvesUser', () => {
  const accounts = [alicePayroll, bobPayroll, jointSavings];

  it('includes dest exclusive owner, not dest-shared members', () => {
    const p2p = tx({
      type: 'transfer',
      account_id: 'a-alice',
      to_account_id: 'a-bob',
    });
    expect(transactionInvolvesUser(p2p, 'bob', accounts)).toBe(true);

    const toJoint = tx({
      type: 'transfer',
      account_id: 'a-alice',
      to_account_id: 'a-joint-save',
    });
    expect(transactionInvolvesUser(toJoint, 'alice', accounts)).toBe(true);
    expect(transactionInvolvesUser(toJoint, 'bob', accounts)).toBe(false);
  });
});

describe('reserveViewerIds', () => {
  it('returns every dest member for a dest-shared savings transfer', () => {
    expect(
      reserveViewerIds(
        tx({
          type: 'transfer',
          account_id: 'a-alice',
          to_account_id: 'a-joint-save',
        }),
        accountsToMap([alicePayroll, jointSavings])
      ).sort()
    ).toEqual(['alice', 'bob']);
  });

  it('returns only the exclusive dest owner', () => {
    expect(
      reserveViewerIds(
        tx({
          type: 'transfer',
          account_id: 'a-alice',
          to_account_id: 'a-alice-save',
        }),
        accountsToMap([alicePayroll, aliceSavings])
      )
    ).toEqual(['alice']);
  });
});
