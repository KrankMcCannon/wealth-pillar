import { db } from '@/server/db/drizzle';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { schemaBundle } from '@/server/db/schema-bundle';

export type DbExecutor = PostgresJsDatabase<typeof schemaBundle>;

export function resolveDb(executor?: DbExecutor): DbExecutor {
  return executor ?? db;
}
