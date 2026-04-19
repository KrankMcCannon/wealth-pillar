import { db } from '@/server/db/drizzle';
import { users } from '@/server/db/schema';
import { eq, inArray } from 'drizzle-orm';

export class UsersRepository {
  static async findById(id: string) {
    const records = await db.select().from(users).where(eq(users.id, id));
    return records.length > 0 ? records[0] : null;
  }

  static async findByClerkId(clerkId: string) {
    const records = await db.select().from(users).where(eq(users.clerk_id, clerkId));
    return records.length > 0 ? records[0] : null;
  }

  static async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return await db.select().from(users).where(inArray(users.id, ids));
  }

  static async findByEmail(email: string) {
    const records = await db.select().from(users).where(eq(users.email, email));
    return records.length > 0 ? records[0] : null;
  }

  static async findByGroupId(groupId: string) {
    return await db.select().from(users).where(eq(users.group_id, groupId));
  }

  static async update(userId: string, data: Partial<typeof users.$inferInsert>) {
    const records = await db
      .update(users)
      .set({ ...data, updated_at: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return records.length > 0 ? records[0] : null;
  }

  static async create(data: typeof users.$inferInsert) {
    const records = await db.insert(users).values(data).returning();
    return records.length > 0 ? records[0] : null;
  }

  static async delete(id: string) {
    await db.delete(users).where(eq(users.id, id));
  }
}
