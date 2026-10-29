import { describe, it, expect } from 'vitest';
import { MODAL_TYPES, SETTINGS_MODAL_TYPES, isSettingsModalType } from './url-state';

describe('MODAL_TYPES', () => {
  it('includes 14 modal types (7 entity + 7 settings)', () => {
    expect(MODAL_TYPES).toHaveLength(14);
    expect(MODAL_TYPES).toEqual(
      expect.arrayContaining([
        'transaction',
        'budget',
        'category',
        'recurring',
        'account',
        'import',
        'investment',
        'settings:profile',
        'settings:currency',
        'settings:language',
        'settings:timezone',
        'settings:invite',
        'settings:group',
        'settings:categories',
      ])
    );
  });

  it('identifies settings modal types', () => {
    expect(SETTINGS_MODAL_TYPES).toHaveLength(7);
    expect(isSettingsModalType('settings:language')).toBe(true);
    expect(isSettingsModalType('settings:group')).toBe(true);
    expect(isSettingsModalType('settings:categories')).toBe(true);
    expect(isSettingsModalType('transaction')).toBe(false);
    expect(isSettingsModalType(null)).toBe(false);
  });
});
