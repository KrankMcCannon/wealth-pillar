import type { Sql } from 'postgres';
import { recordDatabaseEvent } from './telemetry';

export class DatabaseTransportDeadlineError extends Error {
  readonly code = 'DATABASE_TRANSPORT_DEADLINE';
  constructor() {
    super('Database response deadline exceeded; verify the operation outcome');
  }
}

/** Stable public client handle. A stalled generation is retired exactly once;
 * no query or transaction is replayed by this manager. */
export function createManagedPostgresClient(factory: () => Sql, deadlineMs = 20_000): Sql {
  let current = factory();
  let ended = false;
  const closing = new Set<Promise<void>>();
  const retire = (owner: Sql) => {
    if (owner !== current || ended) return;
    const previous = current;
    recordDatabaseEvent('pool.retired');
    current = factory();
    const closed = previous.end({ timeout: 0 }).then(
      () => {},
      () => {}
    );
    closing.add(closed);
    closed.finally(() => closing.delete(closed));
  };
  const bounded = <T>(work: PromiseLike<T>, owner: Sql): Promise<T> =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        retire(owner);
        reject(new DatabaseTransportDeadlineError());
      }, deadlineMs);
      Promise.resolve(work).then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        }
      );
    });
  const watch = <T>(value: T, owner: Sql): T => {
    if (!value || (typeof value !== 'object' && typeof value !== 'function') || !('then' in value))
      return value;
    return new Proxy(value, {
      get(target, property) {
        if (property === 'then')
          return (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) =>
            bounded(target as PromiseLike<unknown>, owner).then(resolve, reject);
        const member = Reflect.get(target, property, target);
        return typeof member === 'function'
          ? (...args: unknown[]) => watch(Reflect.apply(member, target, args), owner)
          : member;
      },
    });
  };
  return new Proxy(current, {
    apply(_target, _receiver, args) {
      if (ended) throw new Error('Database client is closed');
      const owner = current;
      return watch(Reflect.apply(owner, owner, args), owner);
    },
    get(_target, property) {
      if (property === 'end')
        return async (options?: { timeout?: number }) => {
          ended = true;
          await current.end(options);
          await Promise.all(closing);
        };
      const member = Reflect.get(current, property, current);
      if (typeof member !== 'function') return member;
      return (...args: unknown[]) => {
        if (ended) throw new Error('Database client is closed');
        const owner = current;
        return watch(Reflect.apply(Reflect.get(owner, property, owner), owner, args), owner);
      };
    },
  });
}
