import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('content cache keys survive docs-only commits and invalidate on source/config/dependency changes', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'wealth-ci-cache-'));
  const script = path.resolve('scripts/ci/cache-keys.mjs');
  const git = (...args) =>
    execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, stdio: 'pipe' });
  const keys = () =>
    Object.fromEntries(
      execFileSync(process.execPath, [script], {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, GITHUB_OUTPUT: '' },
      })
        .trim()
        .split('\n')
        .map((line) => line.split(': '))
    );
  try {
    git('init');
    mkdirSync(path.join(root, 'src'));
    for (const [file, value] of Object.entries({
      'package.json': '{}',
      'pnpm-lock.yaml': 'lockfileVersion: 9',
      '.nvmrc': '22.14.0',
      'src/a.ts': 'export const a=1;',
      'eslint.config.mjs': 'export default [];',
      'tsconfig.json': '{}',
      'next.config.ts': 'export default {};',
    }))
      writeFileSync(path.join(root, file), value);
    git('add', '.');
    const first = keys();
    writeFileSync(path.join(root, 'README.md'), 'Documentation');
    git('add', '.');
    assert.deepEqual(keys(), first);
    writeFileSync(path.join(root, 'src/a.ts'), 'export const a=2;');
    const source = keys();
    for (const name of ['eslint', 'types', 'next']) assert.notEqual(source[name], first[name]);
    writeFileSync(path.join(root, 'pnpm-lock.yaml'), 'lockfileVersion: 9\nchanged: true');
    const deps = keys();
    for (const name of ['eslint', 'types', 'next']) assert.notEqual(deps[name], source[name]);
    writeFileSync(path.join(root, 'eslint.config.mjs'), 'export default [{rules:{}}];');
    assert.notEqual(keys().eslint, deps.eslint);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
