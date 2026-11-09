import { createServer, connect, type Socket, type AddressInfo } from 'node:net';
import { expect, it } from 'vitest';
import { createPostgresClient } from '@/server/db/postgres-client';
import { createManagedPostgresClient } from '@/server/db/managed-postgres-client';

it('reconciles a lost COMMIT response and replaces the stalled pool once without replaying', async () => {
  const url = new URL(process.env.DATABASE_URL!);
  const sockets = new Set<Socket>();
  let dropCommit = true;
  let dropped = false;
  let factories = 0;
  const proxy = createServer((frontend) => {
    const backend = connect(Number(url.port) || 5432, url.hostname);
    sockets.add(frontend);
    sockets.add(backend);
    frontend.on('data', (data) => backend.write(data));
    frontend.on('error', () => backend.destroy());
    backend.on('error', () => frontend.destroy());
    frontend.on('close', () => {
      sockets.delete(frontend);
      backend.destroy();
    });
    backend.on('close', () => {
      sockets.delete(backend);
      frontend.destroy();
    });
    let buffered = Buffer.alloc(0);
    let mute = false;
    backend.on('data', (chunk) => {
      if (mute) return;
      buffered = Buffer.concat([buffered, chunk]);
      while (buffered.length >= 5) {
        const length = 1 + buffered.readInt32BE(1);
        if (buffered.length < length) return;
        const frame = buffered.subarray(0, length);
        buffered = buffered.subarray(length);
        if (dropCommit && frame[0] === 67 && frame.subarray(5).toString() === 'COMMIT\0') {
          // PostgreSQL has committed, but neither CommandComplete nor ReadyForQuery reaches the caller.
          dropCommit = false;
          dropped = true;
          mute = true;
          buffered = Buffer.alloc(0);
          return;
        }
        frontend.write(frame);
      }
    });
  });
  await new Promise<void>((resolve) => proxy.listen(0, '127.0.0.1', resolve));
  const proxyUrl = new URL(url);
  proxyUrl.port = String((proxy.address() as AddressInfo).port);
  const client = createManagedPostgresClient(() => {
    factories++;
    return createPostgresClient(proxyUrl.href, { max: 1 });
  }, 500);
  const authoritative = createPostgresClient(url.href, { max: 1 });
  try {
    await authoritative`create table transport_commit_fixture(operation_id text primary key,result jsonb not null)`;
    await expect(
      client.begin(async (tx) => {
        await tx`insert into transport_commit_fixture values('synthetic-operation','{"status":"committed"}'::jsonb)`;
      })
    ).rejects.toMatchObject({ code: 'DATABASE_TRANSPORT_DEADLINE' });
    expect(dropped).toBe(true);
    expect(factories).toBe(2);
    expect(await authoritative`select operation_id from transport_commit_fixture`).toEqual([
      { operation_id: 'synthetic-operation' },
    ]);
    expect(await client.unsafe('select 1::int as ok').values()).toEqual([[1]]);
    expect(factories).toBe(2);
  } finally {
    await client.end({ timeout: 0 });
    await authoritative`drop table if exists transport_commit_fixture`;
    await authoritative.end();
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve) => proxy.close(() => resolve()));
  }
}, 10_000);
