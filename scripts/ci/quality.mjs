import path from 'node:path';
import { fileURLToPath } from 'node:url';
export function qualityPassed(results, selection) {
  if (
    !selection ||
    !['true', 'false'].includes(selection.unit) ||
    !['true', 'false'].includes(selection.integration)
  )
    return false;
  const expected = {
    plan: 'success',
    checks: 'success',
    build: 'success',
    unit: selection.unit === 'true' ? 'success' : 'skipped',
    integration: selection.integration === 'true' ? 'success' : 'skipped',
  };
  return Object.entries(expected).every(([name, result]) => results[name]?.result === result);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const passed = qualityPassed(JSON.parse(process.env.RESULTS || '{}'), {
    unit: process.env.HAS_UNIT,
    integration: process.env.HAS_INTEGRATION,
  });
  if (!passed)
    process.stderr.write('A required check failed, was cancelled, or was unexpectedly skipped.\n');
  process.exit(passed ? 0 : 1);
}
