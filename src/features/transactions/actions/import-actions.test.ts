import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Account, User } from '@/lib/types';
import { getCurrentUser } from '@/lib/auth/cached-auth';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { UsersRepository } from '@/server/repositories/users.repository';
import { prepareImportUseCase } from '@/server/use-cases/transactions/prepare-import.use-case';
import { bulkCreateTransactionsUseCase } from '@/server/use-cases/transactions/bulk-create-transactions.use-case';
import { prepareImportAction, commitImportAction } from './import-actions';

vi.mock('@/lib/auth/cached-auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/server/repositories/accounts.repository', () => ({
  AccountsRepository: { findById: vi.fn() },
}));
vi.mock('@/server/repositories/users.repository', () => ({
  UsersRepository: { findByIds: vi.fn() },
}));
vi.mock('@/server/use-cases/transactions/prepare-import.use-case', () => ({
  prepareImportUseCase: vi.fn(),
}));
vi.mock('@/server/use-cases/transactions/bulk-create-transactions.use-case', () => ({
  bulkCreateTransactionsUseCase: vi.fn(),
}));

const user = { id: 'u1', role: 'admin', group_id: 'g1' } as User;
const input = {
  group_id: 'g1',
  rows: [
    {
      rowId: 'r1',
      account_id: 'a1',
      date: '2026-06-01',
      amount: 10,
      description: 'Coffee',
      type: 'expense' as const,
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('CLERK_SECRET_KEY', 'test-only-key');
  vi.mocked(getCurrentUser).mockResolvedValue(user);
  vi.mocked(AccountsRepository.findById).mockResolvedValue({
    id: 'a1',
    group_id: 'g1',
    user_ids: ['u1'],
  } as Account);
  vi.mocked(UsersRepository.findByIds).mockImplementation(
    async (ids) =>
      ids.map((id) => ({ id, group_id: 'g1' })) as Awaited<
        ReturnType<typeof UsersRepository.findByIds>
      >
  );
  vi.mocked(prepareImportUseCase).mockImplementation(async ({ rows }) =>
    rows.map((row) => ({
      ...row,
      status: 'new',
      suggestedCategory: 'food',
      likelyInternalTransfer: false,
      includeByDefault: true,
    }))
  );
  vi.mocked(bulkCreateTransactionsUseCase).mockResolvedValue({ inserted: 1, skipped: 0 });
});
afterEach(() => vi.unstubAllEnvs());

async function preparedCommit() {
  const prepared = await prepareImportAction(input);
  expect(prepared.error).toBeNull();
  return {
    group_id: 'g1',
    rows: prepared.data!.map((row) => ({ ...row, category: 'food', user_id: 'u1' })),
  };
}

describe('import action boundary', () => {
  it('generates the hash on the server, ignoring a supplied client hash', async () => {
    const response = await prepareImportAction({
      ...input,
      rows: [{ ...input.rows[0]!, import_hash: 'client-forged' } as (typeof input.rows)[number]],
    });
    expect(response.error).toBeNull();
    expect(response.data?.[0]?.import_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(response.data?.[0]?.preparation_token).toBeTruthy();
  });

  it.each([
    { import_hash: 'f'.repeat(64) },
    { amount: 99 },
    { occurrence_index: 1 },
    { preparation_token: '123.forged' },
  ])('does not call the writer after tampering: %j', async (updates) => {
    const commit = await preparedCommit();
    commit.rows[0] = { ...commit.rows[0]!, ...updates };
    const result = await commitImportAction(commit);
    expect(result.error).toBeTruthy();
    expect(bulkCreateTransactionsUseCase).not.toHaveBeenCalled();
  });

  it('allows editable categories and users while preserving the prepared identity', async () => {
    const commit = await preparedCommit();
    commit.rows[0]!.category = 'other';
    commit.rows[0]!.user_id = 'u2';
    expect((await commitImportAction(commit)).error).toBeNull();
    expect(bulkCreateTransactionsUseCase).toHaveBeenCalledWith([
      expect.objectContaining({
        category: 'other',
        user_id: 'u2',
        import_hash: commit.rows[0]!.import_hash,
      }),
    ]);
  });

  it('rejects receipts reused by another authenticated user', async () => {
    const commit = await preparedCommit();
    vi.mocked(getCurrentUser).mockResolvedValue({ ...user, id: 'u2' });
    expect((await commitImportAction(commit)).error).toBeTruthy();
    expect(bulkCreateTransactionsUseCase).not.toHaveBeenCalled();
  });

  it('rechecks account access on both preparation and commit', async () => {
    const commit = await preparedCommit();
    vi.mocked(AccountsRepository.findById).mockResolvedValue({
      id: 'a1',
      group_id: 'foreign',
      user_ids: ['u1'],
    } as Account);
    expect((await prepareImportAction(input)).error).toBe('Permesso negato');
    expect((await commitImportAction(commit)).error).toBe('Permesso negato');
    expect(bulkCreateTransactionsUseCase).not.toHaveBeenCalled();
  });

  it('rejects legacy commit requests with no preparation proof', async () => {
    const commit = {
      group_id: 'g1',
      rows: [{ ...input.rows[0]!, import_hash: 'f'.repeat(64), category: 'food', user_id: 'u1' }],
    };
    expect(
      (await commitImportAction(commit as Parameters<typeof commitImportAction>[0])).error
    ).toBeTruthy();
    expect(bulkCreateTransactionsUseCase).not.toHaveBeenCalled();
  });
});
