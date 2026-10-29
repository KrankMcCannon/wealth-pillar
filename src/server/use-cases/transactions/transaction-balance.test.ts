import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyTransactionBalanceAdjustments } from './transaction-balance';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';

vi.mock('@/server/repositories/transactions.repository', () => ({
  TransactionsRepository: {
    updateAccountBalance: vi.fn(),
  },
}));

describe('applyTransactionBalanceAdjustments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('credits income to the source account', async () => {
    await applyTransactionBalanceAdjustments(
      { amount: '50', type: 'income', account_id: 'a1', to_account_id: null },
      1
    );
    expect(TransactionsRepository.updateAccountBalance).toHaveBeenCalledWith('a1', 50, undefined);
  });

  it('debits expense from the source account', async () => {
    await applyTransactionBalanceAdjustments(
      { amount: 40, type: 'expense', account_id: 'a1', to_account_id: null },
      1
    );
    expect(TransactionsRepository.updateAccountBalance).toHaveBeenCalledWith('a1', -40, undefined);
  });

  it('moves transfer amount between accounts', async () => {
    await applyTransactionBalanceAdjustments(
      { amount: 25, type: 'transfer', account_id: 'a1', to_account_id: 'a2' },
      1
    );
    expect(TransactionsRepository.updateAccountBalance).toHaveBeenCalledWith('a1', -25, undefined);
    expect(TransactionsRepository.updateAccountBalance).toHaveBeenCalledWith('a2', 25, undefined);
  });
});
