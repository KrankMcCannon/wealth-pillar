import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function selectMode(changes, event = 'pull_request', validBase = true) {
  if (event === 'workflow_dispatch' || !validBase) return 'full';
  if (
    changes.some(
      ({ status, file }) =>
        status === 'D' ||
        /^(package\.json|pnpm-lock\.yaml|\.nvmrc|.*config\.[^/]+|\.env[^/]*|\.github\/|scripts\/ci\/|src\/test\/|messages\/|public\/|.*\.(css|sql)$)/.test(
          file
        )
    )
  )
    return 'full';
  if (changes.every(({ file }) => /\.(md|txt)$/.test(file))) return 'none';
  return 'affected';
}

export function readChanges(base) {
  const parts = execFileSync(
    'git',
    ['diff', '--name-status', '--no-renames', '-z', `${base}...HEAD`],
    { encoding: 'utf8' }
  ).split('\0');
  const changes = [];
  for (let index = 0; index < parts.length - 1; index += 2) {
    changes.push({ status: parts[index], file: parts[index + 1] });
  }
  return changes;
}

function listTests(config, project, base, mode) {
  const args = [
    'node_modules/vitest/vitest.mjs',
    'list',
    '--config',
    config,
    '--filesOnly',
    '--json',
  ];
  if (project) args.push('--project', project);
  if (mode === 'affected') args.push('--changed', base);
  const output = execFileSync(process.execPath, args, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, DATABASE_URL: 'postgres://127.0.0.1/wealth_pillar_test' },
  });
  const files = JSON.parse(output).map((item) =>
    path.relative(process.cwd(), item.file || item.filepath)
  );
  if (files.some((file) => file.startsWith('../') || path.isAbsolute(file)))
    throw new Error('Test outside workspace');
  return [...new Set(files)].sort();
}

export function createPlan({ base, event, changes, validBase, list = listTests }) {
  const mode = selectMode(changes, event, validBase);
  const unit = { include: [] };
  let integration = [];
  if (mode !== 'none') {
    for (const project of ['node', 'dom']) {
      const files = list('vitest.config.ts', project, base, mode);
      if (files.length) unit.include.push({ project, files });
    }
    integration = list('vitest.integration.config.ts', null, base, mode);
  }
  return { mode, base, changes, unit, integration };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const base = process.env.CI_BASE_SHA || '';
  const event = process.env.CI_EVENT_NAME || 'workflow_dispatch';
  let validBase = /^[a-f0-9]{40}$/.test(base) && !/^0+$/.test(base);
  if (validBase) {
    try {
      execFileSync('git', ['cat-file', '-e', `${base}^{commit}`], { stdio: 'ignore' });
    } catch {
      validBase = false;
    }
  }
  const changes = validBase ? readChanges(base) : [];
  const plan = createPlan({ base, event, changes, validBase });
  const unit = JSON.stringify(plan.unit);
  const integration = JSON.stringify(plan.integration);
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `unit=${unit}\nhas_unit=${plan.unit.include.length > 0}\nintegration=${integration}\nhas_integration=${plan.integration.length > 0}\n`
    );
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Test selection\nMode: **${plan.mode}**. Base: \`${base || 'full run'}\`.\n\nUnit: ${plan.unit.include.map(({ project, files }) => `${project}: ${files.length}`).join(', ') || 'none'}. Integration files: ${plan.integration.length}.\n\n<details><summary>Selected files and changes</summary>\n\n\`\`\`json\n${JSON.stringify(plan, null, 2)}\n\`\`\`\n</details>\n`
    );
  process.stdout.write(JSON.stringify(plan, null, 2) + '\n');
}
