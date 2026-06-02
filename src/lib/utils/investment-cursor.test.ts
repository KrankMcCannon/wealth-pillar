import { describe, it, expect } from 'vitest';
import { decodeInvestmentCursor, encodeInvestmentCursor } from './investment-cursor';

describe('investment-cursor', () => {
  it('round-trips created_at and id', () => {
    const row = {
      created_at: new Date('2024-06-15T10:30:00.000Z'),
      id: 'abc-123',
    };
    const token = encodeInvestmentCursor(row);
    const decoded = decodeInvestmentCursor(token);

    expect(decoded?.id).toBe('abc-123');
    expect(decoded?.createdAt.toISOString()).toBe(row.created_at.toISOString());
  });

  it('returns undefined for invalid tokens', () => {
    expect(decodeInvestmentCursor('not-a-valid-token')).toBeUndefined();
  });
});
