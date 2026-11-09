import { resolveDb } from './db-executor';
import { userPreferences } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export class UserPreferencesRepository {
  static async getByUserId(userId: string) {
    const records = await resolveDb()
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.user_id, userId));
    return records[0] || null;
  }

  static async create(data: typeof userPreferences.$inferInsert) {
    const records = await resolveDb().insert(userPreferences).values(data).returning();
    return records[0] || null;
  }

  static async update(userId: string, data: Partial<typeof userPreferences.$inferInsert>) {
    const records = await resolveDb()
      .update(userPreferences)
      .set({ ...data, updated_at: new Date() })
      .where(eq(userPreferences.user_id, userId))
      .returning();
    return records[0] || null;
  }

  static async delete(userId: string) {
    await resolveDb().delete(userPreferences).where(eq(userPreferences.user_id, userId));
  }
}
