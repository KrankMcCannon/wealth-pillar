import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { baselineDirectory } from './baseline.mjs';

const readJson = (name) => JSON.parse(readFileSync(new URL(name, baselineDirectory), 'utf8'));
export const expectedCatalog = () => ({
  ...readJson('catalog.json'),
  ...readJson('permissions.json'),
});

export async function readCatalog(executor) {
  const read = async (file) =>
    (await executor.unsafe(readFileSync(new URL(file, import.meta.url), 'utf8')))[0].catalog;
  return { ...(await read('catalog-query.sql')), ...(await read('permissions-query.sql')) };
}

function canonical(value) {
  if (Array.isArray(value))
    return value.map(canonical).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])])
    );
  // PG 17 patch releases deparse varchar[] -> text[] either as one array cast
  // or as an identical cast on each literal. Normalize only this exact form.
  if (typeof value === 'string')
    return value.replace(
      /\(ARRAY\[((?:'(?:''|[^'])*'::character varying)(?:, '(?:''|[^'])*'::character varying)*)\]\)::text\[\]/g,
      (_, literals) =>
        `ARRAY[${literals.replace(/('(?:''|[^'])*'::character varying)/g, '($1)::text')}]`
    );
  return value;
}

export function catalogDifferences(expected, actual) {
  const differences = [];
  for (const key of Object.keys(expected)) {
    // Managed Supabase owners are platform prerequisites, not application DDL.
    const scoped = (values) =>
      key === 'defaultPrivileges'
        ? (values ?? []).filter((v) => v.owner === 'postgres')
        : (values ?? []);
    const wanted = canonical(scoped(expected[key]));
    const found = canonical(scoped(actual[key]));
    if (JSON.stringify(wanted) !== JSON.stringify(found))
      differences.push({
        area: key,
        expected: Array.isArray(wanted) ? wanted.length : null,
        actual: Array.isArray(found) ? found.length : null,
        expectedHash: createHash('sha256').update(JSON.stringify(wanted)).digest('hex'),
        actualHash: createHash('sha256').update(JSON.stringify(found)).digest('hex'),
      });
  }
  return differences;
}

export function assertCatalogEquivalent(expected, actual) {
  const differences = catalogDifferences(expected, actual);
  if (differences.length)
    throw new Error(`Database catalog diverges: ${JSON.stringify(differences)}`);
}
