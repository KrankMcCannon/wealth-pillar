import { describe, it, expect } from 'vitest';
import { MODAL_TYPES, SETTINGS_MODAL_TYPES, isSettingsModalType } from './url-state';

describe('MODAL_TYPES', () => {
  it('includes 13 modal types (6 entity + 7 settings)', () => {
    expect(MODAL_TYPES).toHaveLength(13);
    expect(MODAL_TYPES).toEqual(
      expect.arrayContaining([
        'transaction',
        'budget',
        'category',
        'recurring',
        'account',
        'investment',
        'settings:profile',
        'settings:currency',
        'settings:language',
        'settings:timezone',
        'settings:invite',
        'settings:subscription',
        'settings:delete-account',
      ])
    );
  });

  it('identifies settings modal types', () => {
    expect(SETTINGS_MODAL_TYPES).toHaveLength(7);
    expect(isSettingsModalType('settings:language')).toBe(true);
    expect(isSettingsModalType('transaction')).toBe(false);
    expect(isSettingsModalType(null)).toBe(false);
  });
});
