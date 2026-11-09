import { FinancialResourcePolicy } from '@/server/permissions/financial-resource-policy';
import { createHash, randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { financialOperations, users } from '@/server/db/schema';
import { financialTransaction, resolveDb } from '@/server/repositories/db-executor';
import type { User } from '@/lib/types';
import { withDatabaseOperation } from '@/server/db/telemetry';

export function canonicalPayload(value: unknown): string {
  const normalize = (input: unknown): unknown => {
    if (input instanceof Date) return input.toISOString();
    if (Array.isArray(input)) return input.map(normalize);
    if (input && typeof input === 'object')
      return Object.fromEntries(
        Object.entries(input)
          .filter(([, value]) => value !== undefined)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => [key, normalize(value)])
      );
    if (typeof input === 'number' && !Number.isFinite(input))
      throw new Error('Invalid numeric input');
    return input;
  };
  return JSON.stringify(normalize(value));
}

/** A stored receipt never grants access after an account becomes private. */
async function assertReceiptVisibility(actor: User, receipt: unknown): Promise<void> {
  const accountIds = new Set<string>();
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const row = value as Record<string, unknown>;
    for (const key of ['account_id', 'to_account_id'])
      if (typeof row[key] === 'string') accountIds.add(row[key]);
    if (row.accountBalances && typeof row.accountBalances === 'object')
      Object.keys(row.accountBalances).forEach((id) => accountIds.add(id));
    if (typeof row.id === 'string' && Array.isArray(row.user_ids) && 'balance' in row)
      accountIds.add(row.id);
    Object.values(row).forEach(visit);
  };
  visit(receipt);
  if (accountIds.size) await new FinancialResourcePolicy(actor).assertAccounts([...accountIds]);
}

export async function executeFinancialOperation<T>(options: {
  actor: User;
  kind: string;
  operationId?: string | undefined;
  payload: unknown;
  execute: () => Promise<T>;
}): Promise<T> {
  const { actor, kind } = options;
  const operationId = options.operationId ?? randomUUID();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(operationId))
    throw new Error('INVALID_OPERATION_ID');
  if (!actor.group_id) throw new Error('UNAUTHORIZED');
  const hash = createHash('sha256').update(canonicalPayload(options.payload)).digest('hex');
  return withDatabaseOperation(kind, () =>
    financialTransaction(async (tx) => {
      // Coordinate multi-resource commands before their ledger/account locks.
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${`financial-commands:${actor.group_id}`}::text,0::bigint))`
      );
      // Serialize commands by actor without blocking FK KEY SHARE checks. This
      // also avoids shared-lock upgrades when a command changes its default account.
      const [member] = await tx
        .select()
        .from(users)
        .where(eq(users.id, actor.id))
        .for('no key update');
      if (!member || member.group_id !== actor.group_id || member.role !== actor.role)
        throw new Error('AUTHORIZATION_CHANGED');
      const key = and(
        eq(financialOperations.group_id, actor.group_id!),
        eq(financialOperations.actor_id, actor.id),
        eq(financialOperations.kind, kind),
        eq(financialOperations.operation_id, operationId)
      );
      const [claimed] = await tx
        .insert(financialOperations)
        .values({
          group_id: actor.group_id!,
          actor_id: actor.id,
          kind,
          operation_id: operationId,
          payload_hash: hash,
        })
        .onConflictDoNothing()
        .returning({ operation_id: financialOperations.operation_id });
      if (!claimed) {
        const [existing] = await tx.select().from(financialOperations).where(key);
        if (!existing || existing.payload_hash !== hash)
          throw new Error('OPERATION_PAYLOAD_MISMATCH');
        if (!existing.committed_at || existing.result === null)
          throw new Error('OPERATION_OUTCOME_UNKNOWN');
        await assertReceiptVisibility(actor, existing.result);
        return existing.result as T;
      }
      const result = await options.execute();
      // Match the serialized Server Action boundary on the first response and replay.
      const authoritative = JSON.parse(JSON.stringify(result)) as T;
      await tx
        .update(financialOperations)
        .set({ result: authoritative, committed_at: new Date() })
        .where(key);
      return authoritative;
    })
  );
}

/** Absence is unknown: the original transaction may still be executing. */
export async function readFinancialOperation(actor: User, kind: string, operationId: string) {
  if (!actor.group_id) throw new Error('UNAUTHORIZED');
  const executor = resolveDb();
  const [member] = await executor.select().from(users).where(eq(users.id, actor.id));
  if (!member || member.group_id !== actor.group_id || member.role !== actor.role)
    throw new Error('AUTHORIZATION_CHANGED');
  const [operation] = await executor
    .select({ result: financialOperations.result, committed_at: financialOperations.committed_at })
    .from(financialOperations)
    .where(
      and(
        eq(financialOperations.group_id, actor.group_id),
        eq(financialOperations.actor_id, actor.id),
        eq(financialOperations.kind, kind),
        eq(financialOperations.operation_id, operationId)
      )
    );
  if (operation?.committed_at) await assertReceiptVisibility(actor, operation.result);
  return operation?.committed_at
    ? { status: 'committed' as const, result: operation.result }
    : { status: 'unknown' as const };
}
