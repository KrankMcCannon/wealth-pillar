import { sql } from 'drizzle-orm';
import type { DbExecutor } from './db-executor';

/** Serializes projection rebuilds with holding edits, including the first holding. */
export async function lockPortfolio(userId: string, executor: DbExecutor) {
  await executor.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${`portfolio:${userId}`}, 0))`
  );
}
