import { db } from '@/server/db/drizzle';
import { userPreferences } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export class UserPreferencesRepository {
  static async getByUserId(userId: string) {
    const records = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.user_id, userId));
    return records[0] || null;
  }

  static async create(data: typeof userPreferences.$inferInsert) {
    const records = await db.insert(userPreferences).values(data).returning();
    return records[0] || null;
  }

  static async update(userId: string, data: Partial<typeof userPreferences.$inferInsert>) {
    const records = await db
      .update(userPreferences)
      .set({ ...data, updated_at: new Date() })
      .where(eq(userPreferences.user_id, userId))
      .returning();
    return records[0] || null;
  }

  static async delete(userId: string) {
    await db.delete(userPreferences).where(eq(userPreferences.user_id, userId));
  }
}
