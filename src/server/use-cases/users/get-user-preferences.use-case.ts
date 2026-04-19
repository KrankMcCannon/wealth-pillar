import { cached } from '@/lib/cache';
import { cacheOptions } from '@/lib/cache/config';
import { userPreferencesCacheKeys } from '@/lib/cache/keys';
import { validateId } from '@/lib/utils/validation-utils';
import { UserPreferencesRepository } from '@/server/repositories/user-preferences.repository';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/config';

const DEFAULT_PREFERENCES = {
  currency: 'EUR',
  language: 'it-IT',
  timezone: 'Europe/Rome',
  notifications_push: true,
  notifications_email: false,
  notifications_budget_alerts: true,
};

export async function getUserPreferencesUseCase(userId: string) {
  validateId(userId, 'User ID');

  const getCachedPreferences = cached(
    async () => {
      let prefs = await UserPreferencesRepository.getByUserId(userId);

      if (!prefs) {
        prefs = await UserPreferencesRepository.create({
          user_id: userId,
          ...DEFAULT_PREFERENCES,
        });
      }

      return prefs;
    },
    userPreferencesCacheKeys.byUser(userId),
    cacheOptions.userPreferences(userId)
  );

  const preferences = await getCachedPreferences();

  if (!preferences) {
    throw new Error('Failed to get or create user preferences');
  }

  return preferences;
}
export async function updateUserPreferencesUseCase(
  userId: string,
  updates: Partial<typeof DEFAULT_PREFERENCES>
) {
  validateId(userId, 'User ID');

  const updated = await UserPreferencesRepository.update(userId, updates);

  revalidateTag(CACHE_TAGS.USER_PREFERENCE(userId), 'max');

  return updated;
}
