import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { generateDrizzleJson } from 'drizzle-kit/api';
import * as schema from './schema';

it('models the actual active catalog keys and indexes without duplicate declarations', () => {
  const current = generateDrizzleJson(schema);
  const catalog = JSON.parse(readFileSync('src/server/db/baseline/0003_catalog.json', 'utf8')) as {
    tables: { name: string }[];
    indexes: { table: string; name: string; constraint: boolean }[];
    constraints: { table: string; name: string; type: string; definition: string }[];
  };
  for (const table of catalog.tables) {
    const declared = current.tables[`public.${table.name}`]!;
    expect(declared, table.name).toBeDefined();
    expect(Object.keys(declared.indexes).sort(), `${table.name} indexes`).toEqual(
      catalog.indexes
        .filter((index) => index.table === table.name && !index.constraint)
        .map((index) => index.name)
        .sort()
    );
    for (const constraint of catalog.constraints.filter(
      (constraint) => constraint.table === table.name
    )) {
      if (constraint.type === 'f')
        expect(declared.foreignKeys[constraint.name], constraint.name).toBeDefined();
      if (constraint.type === 'u')
        expect(declared.uniqueConstraints[constraint.name], constraint.name).toBeDefined();
      if (constraint.type === 'p') {
        const primary = Object.values<{ name: string; primaryKey: boolean }>(declared.columns)
          .filter((column) => column.primaryKey)
          .map((column) => column.name);
        const composite = Object.values<{ columns: string[] }>(
          declared.compositePrimaryKeys
        ).flatMap((key) => key.columns);
        expect([...primary, ...composite].sort(), `${table.name} primary key`).toEqual(
          constraint.definition
            .match(/PRIMARY KEY \(([^)]+)\)/)![1]!
            .split(', ')
            .map((column) => column.replaceAll('"', ''))
            .sort()
        );
      }
    }
  }
});
