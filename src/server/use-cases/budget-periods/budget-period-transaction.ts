import { financialTransaction } from '@/server/repositories/db-executor';
import { sql } from 'drizzle-orm';
import type { DbExecutor } from '@/server/repositories/db-executor';

/** Serialize timeline/snapshot mutations for one user, including creation of new rows. */
export async function withBudgetPeriodTransaction<T>(
  userId: string,
  mutate: (executor: DbExecutor) => Promise<T>
): Promise<T> {
  if (!userId?.trim()) throw new Error('User ID is required');
  return financialTransaction(
    async (tx) => {
      // Transaction-scoped: released on both commit and rollback, also on pooled connections.
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${`budget-periods:${userId}`}::text, 0::bigint))`
      );
      return mutate(tx);
    },
    { isolationLevel: 'read committed' }
  );
}
