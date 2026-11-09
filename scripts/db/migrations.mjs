import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { baselineDirectory } from './baseline.mjs';
import { assertCatalogEquivalent, expectedCatalog, readCatalog } from './catalog.mjs';

const digest = (text) => createHash('sha256').update(text).digest('hex');
export function migrationFiles() {
  const manifest = JSON.parse(readFileSync(new URL('migrations.json', baselineDirectory), 'utf8'));
  const known = new Set(manifest.map((entry) => `${entry.name}.sql`));
  const unknown = readdirSync(baselineDirectory).filter(
    (name) => /^\d+_.*\.sql$/.test(name) && !known.has(name)
  );
  if (unknown.length)
    throw new Error('Unregistered migration: generate and verify its catalog before adoption');
  return manifest.map((entry, version) => {
    if (!entry.name.startsWith(String(version).padStart(4, '0') + '_'))
      throw new Error('Migration manifest is not contiguous');
    const sql = readFileSync(new URL(`${entry.name}.sql`, baselineDirectory), 'utf8');
    const catalog =
      version === 0
        ? expectedCatalog()
        : JSON.parse(readFileSync(new URL(entry.catalog, baselineDirectory), 'utf8'));
    return { version, name: entry.name, sql, hash: digest(sql), catalog };
  });
}

async function assertLegacyJournal(executor) {
  const [exists] = await executor`select to_regclass('drizzle.__drizzle_migrations')::text as name`;
  if (!exists.name) return;
  const journal = JSON.parse(
    readFileSync(new URL('../../src/server/db/drizzle/meta/_journal.json', import.meta.url), 'utf8')
  );
  const known = new Set(
    journal.entries.map((entry) =>
      digest(
        readFileSync(
          new URL(`../../src/server/db/drizzle/${entry.tag}.sql`, import.meta.url),
          'utf8'
        )
      )
    )
  );
  const entries = await executor.unsafe('select hash from drizzle.__drizzle_migrations');
  if (entries.some((entry) => !known.has(entry.hash)))
    throw new Error('Unknown historical migration; adoption refused');
}

/** Administrative executor only. The caller owns the outer transaction. */
export async function migrateDatabase(
  executor,
  mode = 'migrate',
  targetVersion = Number.MAX_SAFE_INTEGER
) {
  if (!['migrate', 'adopt', 'verify'].includes(mode))
    throw new Error('Expected migrate, adopt or verify');
  const [version] = await executor`select current_setting('server_version_num')::int as version`;
  if (version.version < 170000) throw new Error('PostgreSQL 17 or newer is required');
  await executor`select pg_advisory_xact_lock(hashtextextended('wealth-pillar:migrations', 0))`;
  await executor`set local lock_timeout = '5s'`;
  await executor`set local statement_timeout = '60s'`;
  await assertLegacyJournal(executor);
  const files = migrationFiles().filter((file) => file.version <= targetVersion);
  const [journal] =
    await executor`select to_regclass('wealth_pillar_migrations.journal')::text as name`;
  let applied = [];
  if (journal.name)
    applied = await executor.unsafe(
      'select version, hash from wealth_pillar_migrations.journal order by version'
    );
  for (let i = 0; i < applied.length; i++) {
    if (applied[i].version !== i || files[i]?.hash !== applied[i].hash)
      throw new Error('Unknown or modified migration history');
  }
  if (applied.length) {
    await assertCatalogEquivalent(files[applied.length - 1].catalog, await readCatalog(executor));
  } else {
    const actual = await readCatalog(executor);
    const empty = !actual.tables?.length && !actual.views?.length && !actual.functions?.length;
    if (mode === 'adopt') {
      assertCatalogEquivalent(files[0].catalog, actual);
    } else if (empty && mode === 'migrate') {
      await executor.unsafe("set local wealth_pillar.fresh_install='true'");
      await executor.unsafe(files[0].sql);
      assertCatalogEquivalent(files[0].catalog, await readCatalog(executor));
    } else {
      throw new Error(
        'Unadopted database: explicitly adopt an equivalent baseline or use an empty database'
      );
    }
    if (mode === 'verify') throw new Error('Database history is not adopted');
    await executor.unsafe(`CREATE SCHEMA IF NOT EXISTS wealth_pillar_migrations;
      REVOKE ALL ON SCHEMA wealth_pillar_migrations FROM PUBLIC;
      CREATE TABLE wealth_pillar_migrations.journal (version integer PRIMARY KEY, hash text NOT NULL, applied_at timestamptz NOT NULL DEFAULT clock_timestamp());`);
    await executor`insert into wealth_pillar_migrations.journal (version, hash) values (${files[0].version}, ${files[0].hash})`;
    applied = [{ version: 0, hash: files[0].hash }];
  }
  if (mode === 'adopt' || mode === 'verify')
    return { applied: applied.length, pending: files.length - applied.length };
  for (const file of files.slice(applied.length)) {
    await executor.unsafe(file.sql);
    assertCatalogEquivalent(file.catalog, await readCatalog(executor));
    await executor`insert into wealth_pillar_migrations.journal (version, hash) values (${file.version}, ${file.hash})`;
  }
  return { applied: files.length, pending: 0 };
}
