import { describe, it, expect } from 'vitest';
import { isOnboardingComplete } from './clerk-session';

describe('isOnboardingComplete', () => {
  it('returns false when user is null', () => {
    expect(isOnboardingComplete(null)).toBe(false);
  });

  it('returns false when group_id is missing or blank', () => {
    expect(isOnboardingComplete({ group_id: null })).toBe(false);
    expect(isOnboardingComplete({ group_id: '  ' })).toBe(false);
  });

  it('returns true when group_id is set', () => {
    expect(isOnboardingComplete({ group_id: 'g1' })).toBe(true);
  });
});
