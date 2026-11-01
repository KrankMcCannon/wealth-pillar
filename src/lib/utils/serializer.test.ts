import { expect, it } from 'vitest';
import { serialize } from './serializer';

it('preserves bigint precision in nested rows crossing the JSON cache boundary', () => {
  const result = serialize({
    accounts: [{ balance_version: BigInt('9007199254740993') }],
    date: new Date('2026-11-01T12:00:00Z'),
    absent: null,
  });
  expect(JSON.parse(JSON.stringify(result))).toEqual({
    accounts: [{ balance_version: '9007199254740993' }],
    date: '2026-11-01T12:00:00.000Z',
    absent: null,
  });
});

it('turns Date values into ISO strings for server actions', () => {
  const date = new Date('2024-06-01T10:00:00.000Z');
  expect(serialize({ created_at: date })).toEqual({ created_at: '2024-06-01T10:00:00.000Z' });
});
