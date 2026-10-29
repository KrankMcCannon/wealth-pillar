import { describe, expect, it } from 'vitest';
import { serialize } from './serializer';

describe('serialize', () => {
  it('turns Date values into ISO strings for server actions', () => {
    const date = new Date('2024-06-01T10:00:00.000Z');
    expect(serialize({ created_at: date })).toEqual({ created_at: '2024-06-01T10:00:00.000Z' });
  });
});
