import { db } from '@/server/db/drizzle';
import { groups } from '@/server/db/schema';
import { eq, sql } from 'drizzle-orm';

export class GroupsRepository {
  static async getById(id: string) {
    const records = await db.select().from(groups).where(eq(groups.id, id));
    return records[0] || null;
  }

  static async create(data: typeof groups.$inferInsert) {
    const records = await db.insert(groups).values(data).returning();
    return records[0];
  }

  static async update(id: string, data: Partial<typeof groups.$inferInsert>) {
    const records = await db
      .update(groups)
      .set({ ...data, updated_at: new Date() })
      .where(eq(groups.id, id))
      .returning();
    return records[0];
  }

  static async delete(id: string) {
    await db.delete(groups).where(eq(groups.id, id));
  }

  static async getByUserIds(userIds: string[]) {
    // Check if any of the userIds in the groups.user_ids array overlap with the provided userIds
    // In Drizzle/Postgres: user_ids && ARRAY['id1', 'id2']
    return db
      .select()
      .from(groups)
      .where(sql`${groups.user_ids} && ${userIds}`);
  }
}
