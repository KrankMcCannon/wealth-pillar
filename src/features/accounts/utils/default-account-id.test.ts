import { describe, expect, it } from 'vitest';
import { defaultAccountUserId } from './default-account-id';

describe('defaultAccountUserId', () => {
  it('sets the current user when they are an owner of a shared account', () => {
    expect(defaultAccountUserId(true, ['u2', 'u1'], 'u1')).toBe('u1');
  });

  it('sets the sole owner when the current user is not on the account', () => {
    expect(defaultAccountUserId(true, ['u2'], 'u1')).toBe('u2');
  });

  it('skips when default is off', () => {
    expect(defaultAccountUserId(false, ['u1'], 'u1')).toBeUndefined();
  });
});
