import type { Account, Transaction } from '@/lib/types';
import { describe, expect, it } from 'vitest';
import {
  accountsToMap,
  budgetSignedForUser,
  classifyMovement,
  classifyTransferSavingsDeltaCents,
  computeNetSavings,
  computeTransactionImpact,
  foldBudgetSpent,
  foldCashFlow,
  foldPeriodAmounts,
  reserveViewerIds,
  transactionInvolvesUser,
} from './index';

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
const aliceCash = account({ id: 'a-alice-cash', user_ids: ['alice'], type: 'cash' });
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

const june = {
  start: new Date('2024-06-01'),
  end: new Date('2024-06-30T23:59:59'),
};

describe('classifyMovement', () => {
  it('P2P split: budget + cash legs, household cashFlow 0', () => {
    const movement = classifyMovement(
      tx({
        type: 'transfer',
        account_id: 'a-alice',
        to_account_id: 'a-bob',
        amount: 80,
      }),
      accountsToMap([alicePayroll, bobPayroll])
    );
    expect(movement.kind).toBe('split_transfer');
    expect(movement.cashFlowCents).toBe(0);
    expect(movement.budgetLegs).toEqual([
      { userId: 'alice', signedCents: 8000 },
      { userId: 'bob', signedCents: -8000 },
    ]);
    expect(movement.cashLegs).toEqual(movement.budgetLegs);
    expect(movement.spendableDeltaCents).toBe(0);
    expect(movement.savingsDeltaCents).toBe(0);
  });

  it('dest-shared savings: source budget only, no cash-out', () => {
    const movement = classifyMovement(
      tx({
        type: 'transfer',
        account_id: 'a-alice',
        to_account_id: 'a-joint-save',
        amount: 50,
        category: 'savings',
      }),
      accountsToMap([alicePayroll, jointSavings])
    );
    expect(movement.kind).toBe('savings_transfer');
    expect(movement.budgetLegs).toEqual([{ userId: 'alice', signedCents: 5000 }]);
    expect(movement.cashLegs).toEqual([]);
    expect(movement.savingsDeltaCents).toBe(5000);
    expect(movement.savingsUserId).toBe('alice');
    expect(movement.cashFlowCents).toBe(0);
  });

  it('exclusive savings deposit counts as budget spent, not cash-out', () => {
    const movement = classifyMovement(
      tx({
        type: 'transfer',
        account_id: 'a-alice',
        to_account_id: 'a-alice-save',
        amount: 70,
      }),
      accountsToMap([alicePayroll, aliceSavings])
    );
    expect(movement.kind).toBe('savings_transfer');
    expect(movement.budgetLegs).toEqual([{ userId: 'alice', signedCents: 7000 }]);
    expect(movement.cashLegs).toEqual([]);
    expect(movement.savingsDeltaCents).toBe(7000);
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
    ).toBe(70);
  });

  it('savings withdrawal credits budget and reduces Riserva', () => {
    const movement = classifyMovement(
      tx({
        type: 'transfer',
        account_id: 'a-alice-save',
        to_account_id: 'a-alice',
        amount: 20,
      }),
      accountsToMap([alicePayroll, aliceSavings])
    );
    expect(movement.kind).toBe('savings_transfer');
    expect(movement.budgetLegs).toEqual([{ userId: 'alice', signedCents: -2000 }]);
    expect(movement.cashLegs).toEqual([]);
    expect(movement.savingsDeltaCents).toBe(-2000);
  });

  it('same-owner spendable shuffle is internal', () => {
    const movement = classifyMovement(
      tx({
        type: 'transfer',
        account_id: 'a-alice',
        to_account_id: 'a-alice-cash',
        amount: 15,
      }),
      accountsToMap([alicePayroll, aliceCash])
    );
    expect(movement.kind).toBe('internal_transfer');
    expect(movement.budgetLegs).toEqual([]);
    expect(movement.cashLegs).toEqual([]);
    expect(movement.savingsDeltaCents).toBe(0);
  });

  it('pooling into joint spendable is internal, not savings or split', () => {
    const movement = classifyMovement(
      tx({
        type: 'transfer',
        account_id: 'a-alice',
        to_account_id: 'a-joint',
        amount: 25,
      }),
      accountsToMap([alicePayroll, jointChecking])
    );
    expect(movement.kind).toBe('internal_transfer');
    expect(movement.budgetLegs).toEqual([]);
    expect(movement.cashLegs).toEqual([]);
  });

  it('source-shared split uses recorder, not every source member', () => {
    const movement = classifyMovement(
      tx({
        type: 'transfer',
        user_id: 'alice',
        account_id: 'a-joint',
        to_account_id: 'a-bob',
        amount: 40,
      }),
      accountsToMap([jointChecking, bobPayroll])
    );
    expect(movement.kind).toBe('split_transfer');
    expect(movement.budgetLegs).toEqual([
      { userId: 'alice', signedCents: 4000 },
      { userId: 'bob', signedCents: -4000 },
    ]);
  });

  it('joint-account expense is recorder-only', () => {
    const movement = classifyMovement(
      tx({ amount: 25, account_id: 'a-joint', user_id: 'alice' }),
      accountsToMap([jointChecking])
    );
    expect(movement.kind).toBe('expense');
    expect(movement.cashFlowCents).toBe(-2500);
    expect(movement.budgetLegs).toEqual([{ userId: 'alice', signedCents: 2500 }]);
    expect(movement.cashLegs).toEqual(movement.budgetLegs);
  });

  it('skips transfer legs when accounts are missing', () => {
    const movement = classifyMovement(
      tx({ type: 'transfer', account_id: 'missing', to_account_id: 'also-missing' }),
      accountsToMap([])
    );
    expect(movement.kind).toBe('ignored');
    expect(movement.budgetLegs).toEqual([]);
    expect(movement.cashLegs).toEqual([]);
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
  });

  it('counts exclusive savings toward the actor envelope', () => {
    expect(
      foldBudgetSpent(
        [
          tx({
            type: 'transfer',
            account_id: 'a-alice',
            to_account_id: 'a-alice-save',
            amount: 70,
          }),
        ],
        [alicePayroll, aliceSavings],
        'alice'
      )
    ).toBe(70);
  });
});

describe('foldCashFlow', () => {
  it('household ignores transfers; person counts split not savings', () => {
    const accounts = [alicePayroll, bobPayroll, aliceSavings];
    const rows = [
      tx({
        type: 'transfer',
        account_id: 'a-alice',
        to_account_id: 'a-bob',
        amount: 40,
      }),
      tx({
        id: 'save',
        type: 'transfer',
        account_id: 'a-alice',
        to_account_id: 'a-alice-save',
        amount: 70,
      }),
    ];
    expect(foldCashFlow(rows, accounts)).toEqual({ income: 0, expenses: 0 });
    expect(foldCashFlow(rows, accounts, 'alice')).toEqual({ income: 0, expenses: 40 });
    expect(foldCashFlow(rows, accounts, 'bob')).toEqual({ income: 40, expenses: 0 });
  });
});

describe('foldPeriodAmounts', () => {
  it('includes categorized savings and split, not internal shuffle', () => {
    const accounts = [alicePayroll, bobPayroll, aliceSavings, aliceCash];
    const result = foldPeriodAmounts(
      [
        tx({ amount: 50, category: 'food' }),
        tx({
          id: 'split',
          type: 'transfer',
          category: 'food',
          account_id: 'a-alice',
          to_account_id: 'a-bob',
          amount: 20,
        }),
        tx({
          id: 'save',
          type: 'transfer',
          category: 'savings',
          account_id: 'a-alice',
          to_account_id: 'a-alice-save',
          amount: 30,
        }),
        tx({
          id: 'shuffle',
          type: 'transfer',
          category: 'food',
          account_id: 'a-alice',
          to_account_id: 'a-alice-cash',
          amount: 10,
        }),
      ],
      accounts,
      june,
      'alice',
      new Set(['food', 'savings'])
    );
    expect(result.spent).toBe(100);
    expect(result.categorySpending).toEqual({ food: 70, savings: 30 });
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

describe('classifyTransferSavingsDeltaCents', () => {
  it('deposit, withdrawal, and spendable shuffle', () => {
    expect(
      classifyTransferSavingsDeltaCents(
        account({ type: 'payroll' }),
        account({ id: 'a2', type: 'savings' }),
        5000
      )
    ).toBe(5000);
    expect(
      classifyTransferSavingsDeltaCents(
        account({ type: 'savings' }),
        account({ id: 'a2', type: 'payroll' }),
        3000
      )
    ).toBe(-3000);
    expect(
      classifyTransferSavingsDeltaCents(
        account({ type: 'payroll' }),
        account({ id: 'a2', type: 'cash' }),
        2000
      )
    ).toBe(0);
  });
});

describe('computeNetSavings', () => {
  const accounts = [
    account({ id: 'a1', name: 'Payroll', type: 'payroll', user_ids: ['u1'] }),
    account({ id: 'a2', name: 'Savings', type: 'savings', user_ids: ['u1'] }),
  ];

  it('sums deposits and withdrawals in window', () => {
    const result = computeNetSavings(
      [
        tx({ type: 'transfer', account_id: 'a1', to_account_id: 'a2', amount: 100, user_id: 'u1' }),
        tx({
          id: 'tx-2',
          type: 'transfer',
          account_id: 'a2',
          to_account_id: 'a1',
          amount: 40,
          user_id: 'u1',
        }),
        tx({
          id: 'tx-3',
          type: 'transfer',
          date: '2024-05-01',
          account_id: 'a1',
          to_account_id: 'a2',
          amount: 999,
          user_id: 'u1',
        }),
      ],
      accounts,
      june,
      'u1'
    );
    expect(result.deposits).toBe(100);
    expect(result.withdrawals).toBe(40);
    expect(result.net).toBe(60);
    expect(result.count).toBe(2);
  });

  it('credits a dest-shared save to the source actor, not every pot member', () => {
    const joint = [
      account({ id: 'a1', type: 'payroll', user_ids: ['u1'] }),
      account({ id: 'a2', type: 'savings', user_ids: ['u1', 'u2'] }),
    ];
    const rows = [
      tx({
        type: 'transfer',
        user_id: 'u1',
        account_id: 'a1',
        to_account_id: 'a2',
        amount: 100,
      }),
    ];
    expect(computeNetSavings(rows, joint, june, 'u1').net).toBe(100);
    expect(computeNetSavings(rows, joint, june, 'u2').net).toBe(0);
  });
});

describe('computeTransactionImpact euros adapter', () => {
  it('household cash-flow ignores transfers', () => {
    const impact = computeTransactionImpact(
      tx({ type: 'transfer', account_id: 'a-alice', to_account_id: 'a-bob' }),
      accountsToMap([alicePayroll, bobPayroll])
    );
    expect(impact.cashFlow).toBe(0);
    expect(impact.kind).toBe('split_transfer');
  });
});
