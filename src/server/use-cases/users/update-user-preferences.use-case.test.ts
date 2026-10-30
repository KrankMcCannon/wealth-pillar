import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateTag } from 'next/cache';
import { UserPreferencesRepository } from '@/server/repositories/user-preferences.repository';
import { getUserPreferencesUseCase } from './get-user-preferences.use-case';
import { updateUserPreferencesUseCase } from './update-user-preferences.use-case';

vi.mock('next/cache', () => ({ updateTag: vi.fn() }));
vi.mock('@/server/repositories/user-preferences.repository', () => ({
  UserPreferencesRepository: { update: vi.fn() },
}));
vi.mock('./get-user-preferences.use-case', () => ({ getUserPreferencesUseCase: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(UserPreferencesRepository.update).mockResolvedValue({ user_id: 'u1' } as never);
});

describe('validated user preferences', () => {
  it.each([
    { user_id: 'other' },
    { id: 'other' },
    { created_at: new Date() },
    { currency: '' },
    { currency: 'ABC' },
    { currency: null },
    { language: 'fr-FR' },
    { timezone: 'Not/AZone' },
    { notifications_push: 'false' },
    { notifications_email: 1 },
    { notifications_budget_alerts: null },
    {},
    { language: undefined },
    null,
  ])('rejects unsafe input before any database access: %j', async (input) => {
    await expect(updateUserPreferencesUseCase('u1', input)).rejects.toThrow();
    expect(getUserPreferencesUseCase).not.toHaveBeenCalled();
    expect(UserPreferencesRepository.update).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
  });
  it('normalizes supported languages and preserves false flags', async () => {
    await updateUserPreferencesUseCase('u1', {
      language: ' EN-gb ',
      currency: 'EUR',
      timezone: 'Europe/London',
      notifications_push: false,
    });
    expect(UserPreferencesRepository.update).toHaveBeenCalledWith('u1', {
      language: 'en-US',
      currency: 'EUR',
      timezone: 'Europe/London',
      notifications_push: false,
    });
    expect(updateTag).toHaveBeenCalledTimes(2);
  });
  it('rejects failed persistence instead of confirming a save', async () => {
    vi.mocked(UserPreferencesRepository.update).mockResolvedValue(null);
    await expect(updateUserPreferencesUseCase('u1', { currency: 'EUR' })).rejects.toThrow(
      'Failed to update'
    );
    expect(updateTag).not.toHaveBeenCalled();
  });
});
