import { AsyncLocalStorage } from 'node:async_hooks';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { schemaBundle } from './schema-bundle';

export type TransactionContext = {
  executor: PostgresJsDatabase<typeof schemaBundle>;
  afterCommit: Map<string, () => void>;
};
export const transactionContext = new AsyncLocalStorage<TransactionContext>();

export function deferUntilCommit(key: string, effect: () => void): boolean {
  const context = transactionContext.getStore();
  if (!context) return false;
  context.afterCommit.set(key, effect);
  return true;
}

export function runCommittedEffects(effects: Map<string, () => void>): void {
  let failed = 0;
  for (const effect of effects.values()) {
    try {
      effect();
    } catch {
      failed++;
    }
  }
  if (failed)
    console.warn(JSON.stringify({ event: 'database.post_commit_effect_failed', count: failed }));
}
