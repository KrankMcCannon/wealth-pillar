import { beforeEach, expect, it, vi } from 'vitest';

const postgres = vi.hoisted(() => vi.fn());
vi.mock('postgres', () => ({ default: postgres }));
import { createPostgresClient } from './postgres-client';
import { supabaseRootCa } from './supabase-root-ca';
import { X509Certificate } from 'node:crypto';
import * as tls from 'node:tls';

beforeEach(() => postgres.mockClear());

it('uses transaction pooler settings without session timeouts', () => {
  createPostgresClient('postgres://user:secret@aws-0-eu.pooler.supabase.com:6543/postgres');
  const options = postgres.mock.calls[0]![1];
  expect(options).toMatchObject({ prepare: false, max_pipeline: 1, queue_timeout: 5 });
  expect(options.ssl).toEqual({
    ca: [...(tls.getCACertificates?.('default') ?? tls.rootCertificates), supabaseRootCa],
    rejectUnauthorized: true,
  });
  expect(options.connection).not.toHaveProperty('statement_timeout');
  expect(options.connection).not.toHaveProperty('transaction_timeout');
});

it('retains direct connection timeouts and pipeline', () => {
  createPostgresClient('postgres://user:secret@db.ref.supabase.co:5432/postgres');
  expect(postgres.mock.calls[0]![1]).toMatchObject({
    prepare: false,
    max_pipeline: 8,
    ssl: {
      ca: [...(tls.getCACertificates?.('default') ?? tls.rootCertificates), supabaseRootCa],
      rejectUnauthorized: true,
    },
    connection: { statement_timeout: 10_000, transaction_timeout: 15_000 },
  });
});

it('keeps system trust for other remote hosts and does not force TLS on local fixtures', () => {
  createPostgresClient('postgres://user:secret@pooler.supabase.com.example:5432/postgres');
  expect(postgres.mock.calls[0]![1].ssl).toBe('verify-full');
  createPostgresClient('postgres://localhost:55439/wealth_pillar_test');
  expect(postgres.mock.calls[1]![1].ssl).toBeUndefined();
});

it('bundles the expected Supabase root CA', () => {
  const root = new X509Certificate(supabaseRootCa);
  expect(root.ca).toBe(true);
  expect(root.fingerprint256.replaceAll(':', '')).toBe(
    '807025AD50D4ED219D2C9C7D299C004F824EB00CF7F65AFEF607D07B72E6CAFA'
  );
});
