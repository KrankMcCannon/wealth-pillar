import { groupReadColumns, relationalReadsEnabled } from './relational-projections';
import { resolveDb } from './db-executor';
import { groups } from '@/server/db/schema';
import { eq, arrayOverlaps, sql } from 'drizzle-orm';

export class GroupsRepository {
  static async getById(id: string) {
    const records = await resolveDb()
      .select(groupReadColumns())
      .from(groups)
      .where(eq(groups.id, id));
    return records[0] || null;
  }

  static async create(data: typeof groups.$inferInsert) {
    const records = await resolveDb().insert(groups).values(data).returning();
    return records[0];
  }

  static async update(id: string, data: Partial<typeof groups.$inferInsert>) {
    const records = await resolveDb()
      .update(groups)
      .set({ ...data, updated_at: new Date() })
      .where(eq(groups.id, id))
      .returning();
    return records[0];
  }

  static async delete(id: string) {
    await resolveDb().delete(groups).where(eq(groups.id, id));
  }

  static async getByUserIds(userIds: string[]) {
    if (userIds.length === 0) return [];
    // Let the UUID column encode the array as one parameter, not a SQL tuple.
    return resolveDb()
      .select(groupReadColumns())
      .from(groups)
      .where(
        relationalReadsEnabled()
          ? sql`exists(select 1 from users u where u.group_id=groups.id and u.id = any(${sql.param(userIds, groups.user_ids)}::uuid[]))`
          : arrayOverlaps(groups.user_ids, userIds)
      );
  }
}
