import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { channel, subscribe, unsubscribe } from 'node:diagnostics_channel';
import type { QueryTrace, PoolEvent } from 'postgres';
import { headers } from 'next/headers';

type Operation = { requestId: string; operation: string; queries: number; databaseMs: number };
type Metric = Record<string, string | number | boolean | null>;
const context = new AsyncLocalStorage<Operation>();
const metrics = channel('wealth-pillar:database:metric');

export function recordDatabaseEvent(
  event:
    'cache.read' | 'cache.miss' | 'mapping' | 'read.retry' | 'mutation.unknown' | 'pool.retired',
  values: { durationMs?: number; rows?: number; bytes?: number } = {}
) {
  if (metrics.hasSubscribers) metrics.publish({ event, ...values });
}

export function measureDatabaseMapping<T>(work: () => T): T {
  if (!metrics.hasSubscribers) return work();
  const start = performance.now();
  const result = work();
  const durationMs = performance.now() - start;
  let bytes = 0;
  try {
    bytes = Buffer.byteLength(JSON.stringify(result) ?? '');
  } catch {
    /* Only sizes are observed. */
  }
  recordDatabaseEvent('mapping', {
    durationMs,
    bytes,
    rows: Array.isArray(result) ? result.length : 1,
  });
  return result;
}

/** Only explicitly selected scalar metrics leave this module. Never spread a driver event. */
export function installDatabaseTelemetry(emit: (event: Metric) => void): () => void {
  const safeEmit = (metric: Metric) => {
    try {
      const operation = context.getStore();
      emit({
        ...metric,
        ...(operation && { requestId: operation.requestId, operation: operation.operation }),
      });
    } catch {
      // Observability must never alter the outcome of a financial operation.
    }
  };
  const query = (message: unknown) => {
    const event = message as QueryTrace;
    const duration = event.complete === null ? 0 : event.complete - event.queued;
    const operation = context.getStore();
    if (operation) {
      operation.queries++;
      operation.databaseMs += duration;
    }
    const code = (event.error as { code?: unknown } | undefined)?.code;
    safeEmit({
      event: 'database.query',
      durationMs: duration,
      queueMs: event.sent === null ? null : event.sent - event.queued,
      roundTripMs:
        event.sent === null || event.complete === null ? null : event.complete - event.sent,
      rows: event.count,
      failed: Boolean(event.error),
      code: typeof code === 'string' && /^[A-Z0-9_]{5,40}$/.test(code) ? code : null,
    });
  };
  const pool = (message: unknown) => {
    const event = message as PoolEvent;
    safeEmit({
      event: `database.pool.${event.event}`,
      connections: event.stats.connections,
      opening: event.stats.opening,
      idle: event.stats.idle,
      leased: event.stats.leased,
      waiting: event.stats.waiting,
    });
  };
  const lifecycleStarts = new WeakMap<object, number>();
  const lifecycle = (kind: 'connect' | 'transaction') => ({
    start: (message: unknown) => lifecycleStarts.set(message as object, performance.now()),
    end: (message: unknown) => {
      const event = message as { error?: unknown; outcome?: string };
      const start = lifecycleStarts.get(event);
      safeEmit({
        event: `database.${kind}`,
        durationMs: start === undefined ? null : performance.now() - start,
        failed: Boolean(event.error),
        ...(kind === 'transaction' && { outcome: event.outcome ?? null }),
      });
      lifecycleStarts.delete(event);
    },
  });
  const connect = lifecycle('connect');
  const transaction = lifecycle('transaction');
  const operation = (message: unknown) => {
    const event = message as Operation & { durationMs: number; failed: boolean };
    safeEmit({
      event: 'database.operation',
      requestId: event.requestId,
      operation: event.operation,
      queries: event.queries,
      databaseMs: event.databaseMs,
      durationMs: event.durationMs,
      failed: event.failed,
    });
  };
  const channels = [
    ['tracing:postgres:query:asyncEnd', query],
    ['postgres:pool', pool],
    ['tracing:postgres:connect:start', connect.start],
    ['tracing:postgres:connect:asyncEnd', connect.end],
    ['tracing:postgres:transaction:start', transaction.start],
    ['tracing:postgres:transaction:asyncEnd', transaction.end],
    ['wealth-pillar:database:operation', operation],
    [
      'wealth-pillar:database:metric',
      (message: unknown) => {
        const event = message as {
          event: string;
          durationMs?: number;
          rows?: number;
          bytes?: number;
        };
        safeEmit({
          event: `database.${event.event}`,
          durationMs: event.durationMs ?? 0,
          rows: event.rows ?? 0,
          bytes: event.bytes ?? 0,
        });
      },
    ],
  ] as const;
  for (const [name, listener] of channels) subscribe(name, listener);
  return () => {
    for (const [name, listener] of channels) unsubscribe(name, listener);
  };
}

/** The operation name is a static code label, never user input or an identifier. */
export async function withDatabaseOperation<T>(
  operation: string,
  work: () => Promise<T>
): Promise<T> {
  if (context.getStore()) return work();
  let requestId = randomUUID() as string;
  try {
    const candidate = (await headers()).get('x-wealth-request-id');
    if (candidate && /^[a-f0-9-]{36}$/i.test(candidate)) requestId = candidate;
  } catch {
    /* Administrative/test calls have no HTTP request context. */
  }
  const state = { requestId, operation, queries: 0, databaseMs: 0 };
  return context.run(state, async () => {
    const start = performance.now();
    let failed = true;
    try {
      const result = await work();
      failed = false;
      return result;
    } finally {
      channel('wealth-pillar:database:operation').publish({
        ...state,
        failed,
        durationMs: performance.now() - start,
      });
    }
  });
}
