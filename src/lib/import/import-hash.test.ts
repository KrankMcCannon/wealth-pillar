import { describe, expect, it } from 'vitest';
import { assignImportHashes, computeImportHash, normalizeImportDescription } from './import-hash';

describe('import-hash', () => {
  it('normalizes descriptions for stable hashing', () => {
    expect(normalizeImportDescription('  Netflix   COM  ')).toBe('netflix com');
  });

  it('produces different hashes for identical rows in the same file via occurrence index', async () => {
    const base = {
      accountId: 'acc-1',
      date: '2026-06-01',
      type: 'expense' as const,
      amount: 10,
      description: 'Coffee',
    };

    const first = await computeImportHash({ ...base, occurrenceIndex: 0 });
    const second = await computeImportHash({ ...base, occurrenceIndex: 1 });
    expect(first).not.toBe(second);
  });

  it('assigns occurrence indexes in file order', async () => {
    const rows = [
      { description: 'Coffee', date: '2026-06-01', type: 'expense' as const, amount: 10 },
      { description: 'Coffee', date: '2026-06-01', type: 'expense' as const, amount: 10 },
    ];
    const withHashes = await assignImportHashes(rows, 'acc-1');
    expect(withHashes[0]?.import_hash).not.toBe(withHashes[1]?.import_hash);
  });
});
