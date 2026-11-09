import { resolveDb, type DbExecutor } from './db-executor';
import { users } from '@/server/db/schema';
import { eq, inArray, placeholder } from 'drizzle-orm';
import { transactionContext } from '@/server/db/transaction-context';
import { readWithRetry } from '@/server/db/read-with-retry';

const clerkLookup = () =>
  resolveDb()
    .select()
    .from(users)
    .where(eq(users.clerk_id, placeholder('clerkId')))
    .prepare('wealth_pillar_user_by_clerk');
let preparedClerkLookup: ReturnType<typeof clerkLookup> | undefined;

export class UsersRepository {
  static async findById(id: string, executor?: DbExecutor) {
    const records = await resolveDb(executor).select().from(users).where(eq(users.id, id));
    return records.length > 0 ? records[0] : null;
  }

  static async findByClerkId(clerkId: string) {
    const records = transactionContext.getStore()
      ? await resolveDb().select().from(users).where(eq(users.clerk_id, clerkId))
      : await readWithRetry(() => {
          preparedClerkLookup ??= clerkLookup();
          return preparedClerkLookup.execute({ clerkId });
        });
    return records.length > 0 ? records[0] : null;
  }

  static async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return await resolveDb()
      .select({ id: users.id, group_id: users.group_id })
      .from(users)
      .where(inArray(users.id, ids));
  }

  static async findByEmail(email: string) {
    const records = await resolveDb().select().from(users).where(eq(users.email, email));
    return records.length > 0 ? records[0] : null;
  }

  static async findByGroupId(groupId: string) {
    return await resolveDb().select().from(users).where(eq(users.group_id, groupId));
  }

  static async update(userId: string, data: Partial<typeof users.$inferInsert>) {
    const records = await resolveDb()
      .update(users)
      .set({ ...data, updated_at: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return records.length > 0 ? records[0] : null;
  }

  static async create(data: typeof users.$inferInsert) {
    const records = await resolveDb().insert(users).values(data).returning();
    return records.length > 0 ? records[0] : null;
  }

  static async delete(id: string) {
    await resolveDb().delete(users).where(eq(users.id, id));
  }
}
