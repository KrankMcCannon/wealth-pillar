import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Exercise the installed Vitest graph and real Git history, not a mocked filename map.
test('Vitest selects direct and transitive dependants, excluding unrelated suites', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'wealth-ci-graph-'));
  const vitest = path.resolve('node_modules/vitest/vitest.mjs');
  const git = (...args) =>
    execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, stdio: 'pipe' });
  try {
    symlinkSync(path.resolve('node_modules'), path.join(root, 'node_modules'), 'dir');
    writeFileSync(
      path.join(root, 'vitest.config.mjs'),
      'export default {test:{environment:"node",include:["*.test.js"]}};'
    );
    writeFileSync(path.join(root, 'shared.js'), 'export const value=1;');
    writeFileSync(path.join(root, 'transitive.js'), 'export {value} from "./shared.js";');
    for (const [name, source] of [
      ['direct', 'shared'],
      ['transitive', 'transitive'],
      ['unrelated', null],
    ]) {
      writeFileSync(
        path.join(root, `${name}.test.js`),
        `${source ? `import {value} from "./${source}.js";` : 'const value=1;'}\nimport {test,expect} from "vitest";test("value",()=>expect(value).toBe(1));`
      );
    }
    git('init');
    git('add', '.');
    git(
      '-c',
      'user.name=CI test',
      '-c',
      'user.email=ci@example.invalid',
      'commit',
      '-m',
      'fixture'
    );
    const base = git('rev-parse', 'HEAD').toString().trim();
    writeFileSync(path.join(root, 'shared.js'), 'export const value=2;');
    const listed = JSON.parse(
      execFileSync(process.execPath, [vitest, 'list', '--filesOnly', '--json', '--changed', base], {
        cwd: root,
        encoding: 'utf8',
      })
    );
    assert.deepEqual(listed.map(({ file }) => path.basename(file)).sort(), [
      'direct.test.js',
      'transitive.test.js',
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
