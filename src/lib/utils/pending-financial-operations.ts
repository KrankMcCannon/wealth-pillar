'use client';

import { getFinancialOperationAction } from '@/features/transactions/actions/operation-actions';
import type { ServiceResult } from '@/lib/types/service-result';
import { DEADLINE_EXPIRED } from './with-deadline';

type Pending = { key: string; id: string; createdAt: number };
const database = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('wealth-pillar-operations', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('pending', { keyPath: 'key' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Pending operation storage unavailable'));
    request.onblocked = () => reject(new Error('Pending operation storage blocked'));
  });

async function registry<T>(
  work: (store: IDBObjectStore, done: (result: T) => void) => void
): Promise<T> {
  const db = await database();
  try {
    return await new Promise<T>((resolve, reject) => {
      // IndexedDB readwrite transactions serialize this acquisition across tabs.
      const tx = db.transaction('pending', 'readwrite');
      let result: T;
      work(tx.objectStore('pending'), (value) => {
        result = value;
      });
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(new Error('Pending operation storage unavailable'));
    });
  } finally {
    db.close();
  }
}

async function operationKey(scope: string, kind: string, payload: unknown) {
  const stable = (value: unknown): unknown => {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(stable);
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, value]) => value !== undefined)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => [key, stable(value)])
      );
    return value;
  };
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(stable(payload)))
  );
  return `${scope}:${kind}:${Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export function runPendingFinancialOperation<T>(
  scope: string,
  kind: string,
  payload: unknown,
  execute: (operationId: string) => Promise<ServiceResult<T>>,
  abandoned: () => boolean = () => false
): Promise<ServiceResult<T>> {
  let timedOut = false;
  const result = runOperation(scope, kind, payload, execute, () => timedOut || abandoned());
  Object.assign(result, {
    [DEADLINE_EXPIRED]: () => {
      timedOut = true;
    },
  });
  return result;
}

async function runOperation<T>(
  scope: string,
  kind: string,
  payload: unknown,
  execute: (operationId: string) => Promise<ServiceResult<T>>,
  abandoned: () => boolean
): Promise<ServiceResult<T>> {
  const key = await operationKey(scope, kind, payload);
  const pending = await registry<{ record: Pending; reused: boolean }>((store, done) => {
    const request = store.get(key);
    request.onsuccess = () => {
      const existing = request.result as Pending | undefined;
      const record = existing ?? { key, id: crypto.randomUUID(), createdAt: Date.now() };
      if (!existing) store.put(record);
      done({ record, reused: Boolean(existing) });
    };
  });
  let result: ServiceResult<T>;
  if (pending.reused) {
    const recovered = await getFinancialOperationAction(kind, pending.record.id);
    if (recovered.error)
      return { data: null, error: recovered.error, errorCode: 'OUTCOME_UNKNOWN' };
    result =
      recovered.data?.status === 'committed'
        ? (recovered.data.result as ServiceResult<T>)
        : await execute(pending.record.id);
  } else result = await execute(pending.record.id);
  if (result.errorCode !== 'OUTCOME_UNKNOWN' && !abandoned()) {
    try {
      await registry<void>((store, done) => {
        const request = store.get(key);
        request.onsuccess = () => {
          if (!abandoned() && (request.result as Pending | undefined)?.id === pending.record.id)
            store.delete(key);
          done();
        };
      });
    } catch {
      /* A storage cleanup error cannot undo the authoritative success. */
    }
  }
  return result;
}
