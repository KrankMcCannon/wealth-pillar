import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositories = join(process.cwd(), 'src/server/repositories');
const administrativeWrites = new Set([
  'groups.repository.ts',
  'users.repository.ts',
  'user-preferences.repository.ts',
  'orphan-users.repository.ts',
  'available-shares.repository.ts',
  'group-invitations.repository.ts',
  'market-data.repository.ts',
]);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')
      ? [path]
      : [];
  });
}

describe('financial repository write contract', () => {
  it('keeps implicit database writes out of financial repositories', () => {
    const violations: string[] = [];
    for (const root of [repositories, join(process.cwd(), 'src/server/use-cases')]) {
      for (const file of sourceFiles(root)) {
        const name = file.slice(root.length + 1);
        const source = readFileSync(file, 'utf8');
        const matches = [...source.matchAll(/resolveDb\(\)\s*\.(insert|update|delete)\s*\(/g)];
        if (
          matches.length &&
          (root.endsWith('repositories') ? !administrativeWrites.has(name) : true)
        ) {
          violations.push(`${name}: ${matches.map((match) => match[1]).join(', ')}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
