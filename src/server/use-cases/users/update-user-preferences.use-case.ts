import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/config';
import { validateId } from '@/lib/utils/validation-utils';
import { UserPreferencesRepository } from '@/server/repositories/user-preferences.repository';
import { getUserPreferencesUseCase } from './get-user-preferences.use-case';
import { userPreferences } from '@/server/db/schema';

type UserPreferencesUpdate = Partial<typeof userPreferences.$inferInsert>;

function normalizeLanguageTag(language: string): string {
  const normalized = language.trim().toLowerCase();

  if (normalized === 'it' || normalized.startsWith('it-')) {
    return 'it-IT';
  }

  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en-US';
  }

  return language;
}

export async function updateUserPreferencesUseCase(userId: string, updates: UserPreferencesUpdate) {
  validateId(userId, 'User ID');

  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('At least one field must be provided for update');
  }

  const normalizedUpdates: UserPreferencesUpdate = {
    ...updates,
    ...(updates.language != null ? { language: normalizeLanguageTag(updates.language) } : {}),
  };

  // Validate currency format (ISO 4217)
  if (normalizedUpdates.currency && !/^[A-Z]{3}$/.test(normalizedUpdates.currency)) {
    throw new Error('Currency must be a valid ISO 4217 code (e.g., EUR, USD)');
  }

  // Validate language format (IETF language tag)
  if (normalizedUpdates.language && !/^[a-z]{2}-[A-Z]{2}$/.test(normalizedUpdates.language)) {
    throw new Error('Language must be a valid IETF language tag (e.g., it-IT, en-US)');
  }

  // Ensure preferences exist first (lazy initialization)
  await getUserPreferencesUseCase(userId);

  const updatedPrefs = await UserPreferencesRepository.update(userId, normalizedUpdates);

  if (!updatedPrefs) {
    throw new Error('Failed to update preferences');
  }

  // Invalidate cache
  revalidateTag(CACHE_TAGS.USER_PREFERENCES, 'max');
  revalidateTag(CACHE_TAGS.USER_PREFERENCE(userId), 'max');

  return updatedPrefs;
}
