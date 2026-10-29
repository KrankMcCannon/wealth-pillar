import { appendFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
function size(file) {
  const stat = statSync(file);
  return stat.isDirectory()
    ? readdirSync(file).reduce((sum, child) => sum + size(path.join(file, child)), 0)
    : stat.size;
}
const rows = [];
for (const [name, file] of [
  ['ESLint', '.eslintcache'],
  ['Types', 'tsconfig.tsbuildinfo'],
  ['Next', '.next/cache'],
]) {
  const hit = process.env[`${name.toUpperCase()}_HIT`];
  if (hit === undefined) continue;
  const present = existsSync(file);
  rows.push(
    `| ${name} | ${hit === 'true' ? 'exact hit' : present ? 'compatible prefix hit' : 'miss'} | ${present ? (size(file) / 1048576).toFixed(2) : '0'} MB |`
  );
}
const summary = `## Incremental cache restore\nNode ${process.versions.node}; ${process.platform}/${process.arch}.\n\n| Cache | Restore | Size |\n| --- | --- | --- |\n${rows.join('\n')}\n\nThese caches only accelerate validation; they do not skip checks or reuse test results.\n`;
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
else process.stdout.write(summary);
