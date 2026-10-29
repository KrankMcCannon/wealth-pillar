import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlan, selectMode } from './plan-tests.mjs';
import { qualityPassed } from './quality.mjs';

for (const file of [
  'package.json',
  'pnpm-lock.yaml',
  '.nvmrc',
  'vitest.config.ts',
  'tsconfig.json',
  'next.config.ts',
  '.github/workflows/ci.yml',
  'src/test/setup.ts',
  'scripts/ci/run-tests.mjs',
  'messages/it.json',
  'app/globals.css',
  'db/change.sql',
]) {
  test(`shared input runs all suites: ${file}`, () =>
    assert.equal(selectMode([{ status: 'M', file }]), 'full'));
}
test('missing baseline, manual runs and deleted/renamed files run all suites', () => {
  assert.equal(selectMode([], 'push', false), 'full');
  assert.equal(selectMode([], 'workflow_dispatch'), 'full');
  assert.equal(selectMode([{ status: 'D', file: 'src/shared.ts' }]), 'full');
});
test('documentation changes do not select executable tests', () =>
  assert.equal(selectMode([{ status: 'M', file: 'README.md' }]), 'none'));
test('source changes use the dependency graph, not filename matching', () =>
  assert.equal(selectMode([{ status: 'M', file: 'src/shared.ts' }]), 'affected'));
test('only nonempty projects and related integration files are emitted', () => {
  const calls = [];
  const plan = createPlan({
    base: 'base',
    event: 'pull_request',
    validBase: true,
    changes: [{ status: 'M', file: 'src/ui.ts' }],
    list: (...args) => {
      calls.push(args);
      return args[1] === 'dom' ? ['src/ui.test.tsx'] : [];
    },
  });
  assert.deepEqual(plan.unit.include, [{ project: 'dom', files: ['src/ui.test.tsx'] }]);
  assert.deepEqual(plan.integration, []);
  assert.equal(calls.length, 3);
  assert.ok(calls.every(([, , base, mode]) => base === 'base' && mode === 'affected'));
});
const success = Object.fromEntries(
  ['plan', 'checks', 'build', 'unit', 'integration'].map((name) => [name, { result: 'success' }])
);
test('Quality requires every selected check', () => {
  assert.equal(qualityPassed(success, { unit: 'true', integration: 'true' }), true);
  for (const name of Object.keys(success)) {
    for (const result of ['failure', 'cancelled', 'skipped']) {
      assert.equal(
        qualityPassed({ ...success, [name]: { result } }, { unit: 'true', integration: 'true' }),
        false
      );
    }
  }
});
test('Quality accepts planned skips only and rejects missing selection/output', () => {
  const skipped = { ...success, unit: { result: 'skipped' }, integration: { result: 'skipped' } };
  assert.equal(qualityPassed(skipped, { unit: 'false', integration: 'false' }), true);
  assert.equal(qualityPassed(skipped, { unit: 'true', integration: 'false' }), false);
  assert.equal(qualityPassed(skipped, { unit: '', integration: 'false' }), false);
  assert.equal(qualityPassed({}, { unit: 'false', integration: 'false' }), false);
});
