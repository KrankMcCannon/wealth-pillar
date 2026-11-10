import { db } from '@/server/db/drizzle';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { schemaBundle } from '@/server/db/schema-bundle';
import { transactionContext, runCommittedEffects } from '@/server/db/transaction-context';

export type DbExecutor = PostgresJsDatabase<typeof schemaBundle>;

export function resolveDb(executor?: DbExecutor): DbExecutor {
  return executor ?? transactionContext.getStore()?.executor ?? db;
}

/** The command owns the transaction; nested command coordination reuses it. */
export async function financialTransaction<T>(
  work: (executor: DbExecutor) => Promise<T>,
  config?: Parameters<typeof db.transaction>[1]
): Promise<T> {
  const current = transactionContext.getStore();
  if (current) return work(current.executor);
  const afterCommit = new Map<string, () => void>();
  const result = await db.transaction(
    (tx) => transactionContext.run({ executor: tx, afterCommit }, () => work(tx)),
    config
  );
  runCommittedEffects(afterCommit);
  return result;
}
