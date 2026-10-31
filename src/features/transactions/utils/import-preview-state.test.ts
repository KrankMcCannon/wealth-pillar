import { describe, expect, it } from 'vitest';
import {
  restorePreviewChoices,
  setPreviewSelection,
  summarizeImportSelection,
  IMPORT_PREVIEW_PAGE_SIZE,
} from './import-preview-state';
import type { PreviewRow } from '../components/import-modal/import-preview-row';
const row = (overrides: Partial<PreviewRow> = {}): PreviewRow =>
  ({
    rowId: 'r1',
    account_id: 'a1',
    user_id: 'u1',
    date: '2026-10-31',
    description: 'Food',
    amount: 0.1,
    type: 'expense',
    status: 'new',
    category: 'food',
    include: true,
    ...overrides,
  }) as PreviewRow;
describe('import preview decisions', () => {
  it('restores decisions while retaining the newly prepared payload', () => {
    const fresh = row({ category: 'auto', include: true });
    const old = row({ category: 'manual', include: false });
    expect(restorePreviewChoices([fresh], [old], new Set(['manual']))[0]).toEqual({
      ...fresh,
      category: 'manual',
      include: false,
    });
  });
  it.each(['account_id', 'user_id', 'date', 'description', 'amount', 'type'] as const)(
    'does not restore after a change to %s',
    (field) => {
      const fresh = row({ [field]: field === 'amount' ? 12 : 'changed' });
      expect(
        restorePreviewChoices(
          [fresh],
          [row({ category: 'manual', include: false })],
          new Set(['manual'])
        )[0]
      ).toEqual(fresh);
    }
  );
  it('never restores selection for a new duplicate and ignores deleted categories', () => {
    const fresh = row({ status: 'duplicate', include: false });
    expect(restorePreviewChoices([fresh], [row({ category: 'deleted' })], new Set())[0]).toEqual(
      fresh
    );
  });
  it('selects all filtered rows in a large file while protecting excluded rows', () => {
    const rows = Array.from({ length: 1500 }, (_, i) =>
      row({
        rowId: String(i),
        include: false,
        status: i === 1 ? 'duplicate' : i === 2 ? 'excluded' : 'new',
      })
    );
    const selected = setPreviewSelection(rows, new Set(rows.map((r) => r.rowId)), true);
    expect(selected.filter((r) => r.include)).toHaveLength(1498);
    expect(selected.slice(0, IMPORT_PREVIEW_PAGE_SIZE)).toHaveLength(50);
    expect(setPreviewSelection(selected, new Set(['3']), false)[3]?.include).toBe(false);
  });
  it('summarizes selected rows by account in cents', () => {
    expect(
      summarizeImportSelection([
        row(),
        row({ rowId: 'r2', amount: 0.2 }),
        row({ account_id: 'a2', type: 'income', amount: 20 }),
        row({ include: false, amount: 100 }),
      ])
    ).toEqual([
      { accountId: 'a1', count: 2, income: 0, expense: 0.3 },
      { accountId: 'a2', count: 1, income: 20, expense: 0 },
    ]);
  });
});
