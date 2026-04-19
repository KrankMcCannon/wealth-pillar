import { db } from '@/server/db/drizzle';
import { groupInvitations } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

export class GroupInvitationsRepository {
  static async getById(id: string) {
    const records = await db.select().from(groupInvitations).where(eq(groupInvitations.id, id));
    return records[0] || null;
  }

  static async getByToken(token: string) {
    const records = await db
      .select()
      .from(groupInvitations)
      .where(eq(groupInvitations.invitation_token, token));
    return records[0] || null;
  }

  static async getByEmailAndGroup(email: string, groupId: string) {
    const records = await db
      .select()
      .from(groupInvitations)
      .where(and(eq(groupInvitations.email, email), eq(groupInvitations.group_id, groupId)));
    return records[0] || null;
  }

  static async getByGroupId(groupId: string) {
    return db.select().from(groupInvitations).where(eq(groupInvitations.group_id, groupId));
  }

  static async create(data: typeof groupInvitations.$inferInsert) {
    const records = await db.insert(groupInvitations).values(data).returning();
    return records[0];
  }

  static async update(id: string, data: Partial<typeof groupInvitations.$inferInsert>) {
    const records = await db
      .update(groupInvitations)
      .set({ ...data, updated_at: new Date() })
      .where(eq(groupInvitations.id, id))
      .returning();
    return records[0];
  }

  static async delete(id: string) {
    await db.delete(groupInvitations).where(eq(groupInvitations.id, id));
  }
}
