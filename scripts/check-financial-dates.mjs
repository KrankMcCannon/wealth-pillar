import { spawnSync } from 'node:child_process';

const tests = [
  'src/lib/utils/financial-date.test.ts',
  'src/lib/utils/financial-form-dates.test.ts',
  'src/lib/utils/transaction-cursor.test.ts',
  'src/server/use-cases/budget-periods/edit-closing-date.use-case.test.ts',
  'src/server/use-cases/budget-periods/rewind-closed-period.use-case.test.ts',
  'src/lib/utils/transaction-date-range.test.ts',
  'src/features/reports/utils/reporting-window.test.ts',
  'src/features/reports/utils/reports-transactions-href.test.ts',
  'src/server/use-cases/reports/report.logic.test.ts',
  'src/server/use-cases/reports/reports.use-cases.test.ts',
];
for (const timezone of ['UTC', 'Europe/Rome', 'America/Los_Angeles']) {
  process.stdout.write(`\nFinancial calendar: ${timezone}\n`);
  const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', ...tests], {
    env: { ...process.env, TZ: timezone },
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
