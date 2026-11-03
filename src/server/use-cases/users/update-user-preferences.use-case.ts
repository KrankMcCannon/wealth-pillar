import { updateTag } from 'next/cache';
import { z } from 'zod';
import { CACHE_TAGS } from '@/lib/cache/config';
import { validateId } from '@/lib/utils/validation-utils';
import { UserPreferencesRepository } from '@/server/repositories/user-preferences.repository';
import { getUserPreferencesUseCase } from './get-user-preferences.use-case';

const preferencesUpdateSchema = z
  .strictObject({
    currency: z.enum(['EUR', 'USD', 'GBP', 'CHF']).optional(),
    language: z
      .string()
      .trim()
      .toLowerCase()
      .transform((value) => {
        if (value === 'it' || value.startsWith('it-')) return 'it-IT';
        if (value === 'en' || value.startsWith('en-')) return 'en-US';
        return value;
      })
      .pipe(z.enum(['it-IT', 'en-US']))
      .optional(),
    timezone: z
      .string()
      .min(1)
      .max(50)
      .refine((value) => {
        try {
          return Boolean(
            new Intl.DateTimeFormat('en', { timeZone: value }).resolvedOptions().timeZone
          );
        } catch {
          return false;
        }
      }, 'Timezone must be a valid IANA identifier')
      .optional(),
    notifications_push: z.boolean().optional(),
    notifications_email: z.boolean().optional(),
    notifications_budget_alerts: z.boolean().optional(),
  })
  .refine(
    (value) => Object.values(value).some((item) => item !== undefined),
    'At least one field must be provided for update'
  );

export async function updateUserPreferencesUseCase(userId: string, updates: unknown) {
  validateId(userId, 'User ID');
  // Validate before any read/creation: client input cannot reassign ownership or timestamps.
  const normalized = preferencesUpdateSchema.parse(updates);
  const safeUpdates = Object.fromEntries(
    Object.entries(normalized).filter(([, value]) => value !== undefined)
  );
  await getUserPreferencesUseCase(userId);
  const updated = await UserPreferencesRepository.update(userId, safeUpdates);
  if (!updated) throw new Error('Failed to update preferences');
  updateTag(CACHE_TAGS.USER_PREFERENCES);
  updateTag(CACHE_TAGS.USER_PREFERENCE(userId));
  return updated;
}
