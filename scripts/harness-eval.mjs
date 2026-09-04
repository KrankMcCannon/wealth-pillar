/* eslint-disable no-console */
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const reportDir = join(process.cwd(), '.antigravity');
const reportFile = join(reportDir, 'eval_report.json');

console.log('=== STARTING DETERMINISTIC EVALUATION HARNESS ===');

const results = {
  timestamp: new Date().toISOString(),
  verdict: 'SUCCESS',
  steps: {
    typecheck: { status: 'PENDING', error: null },
    lint: { status: 'PENDING', error: null },
    test: { status: 'PENDING', error: null },
  },
};

function runStep(name, command) {
  console.log(`Running: ${name} (${command})...`);
  try {
    const stdout = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    results.steps[name] = { status: 'PASSED', output: stdout.slice(-1000) };
    console.log(`[PASS] ${name}`);
  } catch (error) {
    results.verdict = 'FAILURE';
    results.steps[name] = {
      status: 'FAILED',
      exitCode: error.status,
      error: error.message,
      output: (error.stdout || '') + '\n' + (error.stderr || ''),
    };
    console.error(`[FAIL] ${name}`);
  }
}

// 1. Typecheck
runStep('typecheck', 'pnpm typecheck');

// 2. Lint
runStep('lint', 'pnpm lint');

// 3. Vitest unit tests
runStep('test', 'NODE_OPTIONS="-r ./scripts/patch-dns.cjs" pnpm vitest run');

// Ensure directory exists
try {
  mkdirSync(reportDir, { recursive: true });
} catch {}

// Write JSON report
writeFileSync(reportFile, JSON.stringify(results, null, 2), 'utf8');
console.log(`Report written to ${reportFile}`);
console.log(`=== EVALUATION VERDICT: ${results.verdict} ===`);

if (results.verdict === 'FAILURE') {
  process.exit(1);
} else {
  process.exit(0);
}
