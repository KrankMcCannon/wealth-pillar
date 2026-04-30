import { describe, expect, it } from 'vitest';
import {
  decodeTransactionCursor,
  encodeTransactionCursor,
  TRANSACTION_CURSOR_V1,
} from './transaction-cursor';

describe('transaction-cursor', () => {
  it('round-trips a v1 cursor', () => {
    const token = encodeTransactionCursor({
      date: '2024-06-15',
      created_at: '2024-06-15T14:30:00.000Z',
      id: '550e8400-e29b-41d4-a716-446655440000',
    });
    const decoded = decodeTransactionCursor(token);
    expect(decoded).toEqual({
      date: '2024-06-15',
      createdAt: new Date('2024-06-15T14:30:00.000Z'),
      id: '550e8400-e29b-41d4-a716-446655440000',
    });
  });

  it('normalizes Date objects when encoding', () => {
    const token = encodeTransactionCursor({
      date: new Date('2024-01-02T00:00:00.000Z'),
      created_at: new Date('2024-01-02T12:00:00.000Z'),
      id: 'a',
    });
    const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    expect(parsed.v).toBe(TRANSACTION_CURSOR_V1);
    expect(parsed.d).toBe('2024-01-02');
    expect(parsed.c).toBe('2024-01-02T12:00:00.000Z');
  });

  it('returns undefined for invalid tokens', () => {
    expect(decodeTransactionCursor('not-base64!!!')).toBeUndefined();
    expect(decodeTransactionCursor(Buffer.from('{}').toString('base64url'))).toBeUndefined();
  });
});
