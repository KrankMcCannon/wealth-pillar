import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api';
import * as schema from './schema';

it('generates no index rebuilds between the corrected baseline and current schema', async () => {
  const current = generateDrizzleJson(schema);
  const baseline = structuredClone(current);
  const snapshot = JSON.parse(
    readFileSync('src/server/db/drizzle/meta/0004_snapshot.json', 'utf8')
  );
  for (const [name, table] of Object.entries<{ indexes: unknown }>(snapshot.tables)) {
    expect(baseline.tables[name]).toBeDefined();
    baseline.tables[name].indexes = table.indexes;
  }
  expect(await generateMigration(baseline, current)).toEqual([]);
});
