import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prepareImportRowProofs, verifyImportRowProof } from './import-row-proof';

const context = { userId: 'u1', groupId: 'g1' };
const raw = {
  rowId: 'r1',
  account_id: 'a1',
  date: '2026-06-01',
  description: '  Coffee  ',
  amount: 10,
  type: 'expense' as const,
};

beforeEach(() => vi.stubEnv('CLERK_SECRET_KEY', 'test-only-import-signing-secret'));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('server-generated import identity', () => {
  it('preserves the legacy SHA-256 format already stored in the database', async () => {
    const [row] = await prepareImportRowProofs([raw], context);
    expect(row?.import_hash).toBe(
      createHash('sha256').update('a1|2026-06-01|expense|10.00|coffee|0').digest('hex')
    );
  });

  it('preserves original occurrences when committing only a subset', async () => {
    const rows = await prepareImportRowProofs([raw, { ...raw, rowId: 'r2' }], context);
    const second = rows[1]!;
    expect(rows.map((row) => row.occurrence_index)).toEqual([0, 1]);
    expect(rows[0]?.import_hash).not.toBe(second.import_hash);
    await expect(verifyImportRowProof(second, context)).resolves.toBeUndefined();
    const again = await prepareImportRowProofs([raw, { ...raw, rowId: 'r2' }], context);
    expect(again[1]?.import_hash).toBe(second.import_hash);
  });

  it.each([
    { import_hash: 'f'.repeat(64) },
    { occurrence_index: 1 },
    { amount: 20 },
    { account_id: 'foreign' },
    { date: '2026-06-02' },
    { description: 'Changed' },
    { rowId: 'another-row' },
    { type: 'income' as const },
    { preparation_token: '1.invalid' },
  ])('rejects a changed immutable field: %j', async (updates) => {
    const [row] = await prepareImportRowProofs([raw], context);
    await expect(verifyImportRowProof({ ...row!, ...updates }, context)).rejects.toThrow();
  });

  it.each([
    { userId: 'u2', groupId: 'g1' },
    { userId: 'u1', groupId: 'g2' },
  ])('binds the receipt to the uploader and group: %j', async (other) => {
    const [row] = await prepareImportRowProofs([raw], context);
    await expect(verifyImportRowProof(row!, other)).rejects.toThrow();
  });

  it('rejects expiry, altered expiration and receipts signed with a different key', async () => {
    const [row] = await prepareImportRowProofs([raw], context);
    const [expiry, proof] = row!.preparation_token.split('.');
    await expect(
      verifyImportRowProof(
        { ...row!, preparation_token: `${Number(expiry) + 1}.${proof}` },
        context
      )
    ).rejects.toThrow();
    vi.spyOn(Date, 'now').mockReturnValue(Number(expiry) + 1);
    await expect(verifyImportRowProof(row!, context)).rejects.toThrow();
    vi.restoreAllMocks();
    vi.stubEnv('CLERK_SECRET_KEY', 'rotated-test-key');
    await expect(verifyImportRowProof(row!, context)).rejects.toThrow();
  });

  it('rejects duplicate row identifiers', async () => {
    await expect(prepareImportRowProofs([raw, raw], context)).rejects.toThrow(
      'Duplicate import row IDs'
    );
  });
});
