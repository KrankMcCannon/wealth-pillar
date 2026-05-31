import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from './use-settings';

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: { firstName: 'Alex' } }),
  useClerk: () => ({ signOut: vi.fn().mockResolvedValue(undefined) }),
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/navigation/url-state', () => ({
  useModalState: () => ({
    openModal: vi.fn(),
    closeModal: vi.fn(),
  }),
}));

const user = {
  id: 'u1',
  name: 'Alex Mercer',
  email: 'alex@example.com',
  role: 'admin',
} as const;

const preferences = {
  currency: 'EUR',
  language: 'it',
  timezone: 'Europe/Rome',
} as const;

describe('useSettings', () => {
  it('exposes stitch settings handlers without delete/notification APIs', () => {
    const { result } = renderHook(() => useSettings(user as never, preferences as never));

    expect(result.current.userInitials).toBe('AM');
    expect(result.current.isAdmin).toBe(true);
    expect(result.current).not.toHaveProperty('handleDeleteAccountClick');
    expect(result.current).not.toHaveProperty('handleNotificationToggle');
    expect(result.current).not.toHaveProperty('groupUsers');
    expect(result.current).not.toHaveProperty('closeSettingsModal');

    act(() => {
      result.current.handlePreferenceUpdate('currency', 'USD');
    });
    expect(typeof result.current.handlePreferenceUpdate).toBe('function');
  });
});
