import { db } from '@/server/db/drizzle';
import { recurringTransactions, accounts } from '@/server/db/schema';
import { eq, arrayOverlaps, arrayContains } from 'drizzle-orm';

export class RecurringRepository {
  static async findById(id: string) {
    const results = await db
      .select({
        recurring: recurringTransactions,
        account: accounts,
      })
      .from(recurringTransactions)
      .leftJoin(accounts, eq(recurringTransactions.account_id, accounts.id))
      .where(eq(recurringTransactions.id, id));

    if (results.length === 0) return null;

    const firstResult = results[0];

    // Combine the result as the service did
    return {
      ...firstResult?.recurring,
      accounts: firstResult?.account,
    };
  }

  static async findByUser(userId: string) {
    return await db
      .select()
      .from(recurringTransactions)
      .where(arrayContains(recurringTransactions.user_ids, [userId]));
  }

  static async findByUserIds(userIds: string[]) {
    return await db
      .select()
      .from(recurringTransactions)
      .where(arrayOverlaps(recurringTransactions.user_ids, userIds));
  }

  static async create(data: typeof recurringTransactions.$inferInsert) {
    const results = await db.insert(recurringTransactions).values(data).returning();
    return results.length > 0 ? results[0] : null;
  }

  static async update(id: string, data: Partial<typeof recurringTransactions.$inferInsert>) {
    const results = await db
      .update(recurringTransactions)
      .set({ ...data, updated_at: new Date() })
      .where(eq(recurringTransactions.id, id))
      .returning();
    return results.length > 0 ? results[0] : null;
  }

  static async delete(id: string) {
    const results = await db
      .delete(recurringTransactions)
      .where(eq(recurringTransactions.id, id))
      .returning();
    return results.length > 0 ? results[0] : null;
  }
}
