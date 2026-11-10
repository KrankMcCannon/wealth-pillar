import { beforeEach, expect, it, vi } from 'vitest';

const postgres = vi.hoisted(() => vi.fn());
vi.mock('postgres', () => ({ default: postgres }));
import { createPostgresClient } from './postgres-client';

beforeEach(() => postgres.mockClear());

it('uses transaction pooler settings without session timeouts', () => {
  createPostgresClient('postgres://user:secret@aws-0-eu.pooler.supabase.com:6543/postgres');
  const options = postgres.mock.calls[0]![1];
  expect(options).toMatchObject({ prepare: false, max_pipeline: 1, queue_timeout: 5 });
  expect(options.connection).not.toHaveProperty('statement_timeout');
  expect(options.connection).not.toHaveProperty('transaction_timeout');
});

it('retains direct connection timeouts and pipeline', () => {
  createPostgresClient('postgres://user:secret@db.ref.supabase.co:5432/postgres');
  expect(postgres.mock.calls[0]![1]).toMatchObject({
    prepare: false,
    max_pipeline: 8,
    connection: { statement_timeout: 10_000, transaction_timeout: 15_000 },
  });
});
