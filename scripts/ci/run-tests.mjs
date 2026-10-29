import { spawnSync } from 'node:child_process';

const files = JSON.parse(process.env.TEST_FILES || 'null');
if (
  !Array.isArray(files) ||
  files.length === 0 ||
  files.some(
    (file) => typeof file !== 'string' || !/^(src|app|tests)\//.test(file) || file.includes('..')
  )
)
  throw new Error('Expected a nonempty, workspace-local test selection');
const args = ['node_modules/vitest/vitest.mjs', 'run'];
if (process.env.TEST_PROJECT) args.push('--project', process.env.TEST_PROJECT);
else args.push('--config', 'vitest.integration.config.ts');
const result = spawnSync(process.execPath, [...args, ...files], {
  stdio: 'inherit',
  env: process.env,
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
