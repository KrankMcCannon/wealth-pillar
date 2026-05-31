import { describe, it, expect } from 'vitest';
import { isSystemCategory } from './category-helpers';
import { SYSTEM_GROUP_ID } from '@/lib/constants';

describe('isSystemCategory', () => {
  it('returns true for system group id', () => {
    expect(isSystemCategory({ group_id: SYSTEM_GROUP_ID })).toBe(true);
  });

  it('returns false for custom group categories', () => {
    expect(isSystemCategory({ group_id: 'g-custom-123' })).toBe(false);
  });
});
