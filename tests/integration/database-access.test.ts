import { readFileSync } from 'node:fs';
import { afterAll, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db/drizzle';

afterAll(async () => {
  await db.$client.end();
});

it('blocks client tables, views and privileged RPCs while preserving the backend', async () => {
  const migration = readFileSync('src/server/db/drizzle/0009_server_only_data_access.sql', 'utf8');
  const rollback = new Error('rollback fixture');
  await expect(
    db.transaction(async (tx) => {
      // Roles and objects are transactional; nothing survives this isolated fixture.
      await tx.execute(sql`CREATE ROLE anon NOLOGIN`);
      await tx.execute(sql`CREATE ROLE authenticated NOLOGIN`);
      await tx.execute(sql`CREATE ROLE service_role NOLOGIN BYPASSRLS`);
      await tx.execute(sql`CREATE ROLE pool_user NOLOGIN BYPASSRLS`);
      await tx.execute(sql`CREATE TABLE public.transactions (id int PRIMARY KEY, group_id text)`);
      await tx.execute(sql`INSERT INTO public.transactions VALUES (1, 'other-group')`);
      await tx.execute(sql`ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY`);
      await tx.execute(
        sql`CREATE POLICY "Allow all operations on transactions" ON public.transactions USING (true)`
      );
      await tx.execute(
        sql`CREATE VIEW public.access_test_view AS SELECT * FROM public.transactions`
      );
      await tx.execute(
        sql`CREATE FUNCTION public.access_test_rpc() RETURNS int LANGUAGE sql SECURITY DEFINER AS 'SELECT count(*)::int FROM public.transactions'`
      );
      await tx.execute(
        sql`GRANT ALL ON ALL TABLES IN SCHEMA public TO PUBLIC, anon, authenticated`
      );
      await tx.execute(
        sql`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO PUBLIC, anon, authenticated`
      );
      await tx.execute(
        sql`ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated`
      );
      await tx.execute(
        sql`ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated`
      );

      await tx.execute(sql.raw(migration));
      // Idempotent when replayed; no permission or policy is reopened.
      await tx.execute(sql.raw(migration));
      await tx.execute(sql`CREATE TABLE public.access_test_future (id serial)`);
      await tx.execute(
        sql`CREATE FUNCTION public.access_test_future_rpc() RETURNS int LANGUAGE sql SECURITY DEFINER AS 'SELECT 1'`
      );

      for (const role of ['anon', 'authenticated']) {
        const [schema] = await tx.execute(
          sql`SELECT has_schema_privilege(${role}, 'public', 'USAGE') AS allowed`
        );
        expect(schema?.allowed).toBe(false);
        const [grants] = await tx.execute(sql`SELECT
        has_table_privilege(${role}, 'public.transactions', 'SELECT') AS table_access,
        has_table_privilege(${role}, 'public.access_test_view', 'SELECT') AS view_access,
        has_function_privilege(${role}, 'public.access_test_rpc()', 'EXECUTE') AS rpc_access,
        has_function_privilege(${role}, 'public.access_test_future_rpc()', 'EXECUTE') AS future_rpc_access`);
        expect(grants).toMatchObject({
          table_access: false,
          view_access: false,
          rpc_access: false,
          future_rpc_access: false,
        });
        for (const statement of [
          'SELECT * FROM public.transactions',
          "INSERT INTO public.transactions VALUES (2, 'own-group')",
          "UPDATE public.transactions SET group_id = 'own-group'",
          'DELETE FROM public.transactions',
          'SELECT * FROM public.access_test_view',
          'SELECT public.access_test_rpc()',
          'SELECT * FROM public.access_test_future',
          'SELECT public.access_test_future_rpc()',
          "SELECT nextval('public.access_test_future_id_seq')",
        ]) {
          await expect(
            tx.transaction(async (attempt) => {
              await attempt.execute(sql.raw(`SET LOCAL ROLE ${role}`));
              await attempt.execute(sql.raw(statement));
            })
          ).rejects.toMatchObject({ cause: { code: '42501' } });
        }
      }
      for (const role of ['service_role', 'pool_user']) {
        await tx.execute(sql.raw(`SET LOCAL ROLE ${role}`));
        expect(await tx.execute(sql`SELECT * FROM public.transactions`)).toHaveLength(1);
        await tx.execute(sql`INSERT INTO public.transactions VALUES (2, 'backend')`);
        await tx.execute(
          sql`UPDATE public.transactions SET group_id = 'backend-updated' WHERE id = 2`
        );
        expect((await tx.execute(sql`SELECT public.access_test_rpc() AS total`))[0]?.total).toBe(2);
        await tx.execute(sql`DELETE FROM public.transactions WHERE id = 2`);
        await tx.execute(sql`INSERT INTO public.access_test_future DEFAULT VALUES`);
        await tx.execute(sql`RESET ROLE`);
      }
      expect(await tx.execute(sql`SELECT * FROM public.transactions`)).toHaveLength(1);
      const [policy] = await tx.execute(sql`SELECT count(*)::int AS total FROM pg_policies
      WHERE tablename = 'transactions' AND policyname = 'Allow all operations on transactions'`);
      expect(policy?.total).toBe(0);
      throw rollback;
    })
  ).rejects.toBe(rollback);
}, 15000);
