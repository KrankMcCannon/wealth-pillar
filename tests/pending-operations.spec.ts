import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Exercise the production IndexedDB registry in two real browser tabs. Only the
// network outcome lookup is replaced; no alternate storage implementation is used.
const source = readFileSync('src/lib/utils/pending-financial-operations.ts', 'utf8')
  .replace(/^import .*;$/gm, '')
  .replace(
    'export async function runPendingFinancialOperation',
    'async function runPendingFinancialOperation'
  );
const script = ts.transpileModule(
  `const getFinancialOperationAction = async () => ({data:{status:'unknown'},error:null});\n${source}\nObject.assign(window,{runPendingFinancialOperation});`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }
).outputText;

test('retains the same pending operation across two tabs and reload', async ({ page, context }) => {
  const second = await context.newPage();
  for (const tab of [page, second]) {
    await tab.goto('/it');
    await tab.addScriptTag({ content: script });
  }
  const acquire = async (tab: typeof page) =>
    tab.evaluate(async () => {
      const run = (
        window as unknown as {
          runPendingFinancialOperation: (
            scope: string,
            kind: string,
            payload: unknown,
            execute: (id: string) => Promise<unknown>
          ) => Promise<unknown>;
        }
      ).runPendingFinancialOperation;
      let identity = '';
      await run('browser-test', 'test-command', { amount: '0.30' }, async (id) => {
        identity = id;
        return { data: null, error: 'uncertain', errorCode: 'OUTCOME_UNKNOWN' };
      });
      return identity;
    });
  const [first, concurrent] = await Promise.all([acquire(page), acquire(second)]);
  expect(first).toMatch(/^[0-9a-f-]{36}$/);
  expect(concurrent).toBe(first);
  await page.reload();
  await page.addScriptTag({ content: script });
  expect(await acquire(page)).toBe(first);
  await second.close();
});
