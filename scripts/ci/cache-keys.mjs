import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .sort();
function digest(paths) {
  const hash = createHash('sha256');
  for (const file of paths) hash.update(file).update('\0').update(readFileSync(file)).update('\0');
  return hash.digest('hex').slice(0, 24);
}
const runtime = `${process.env.RUNNER_OS || process.platform}-${process.arch}-node${process.versions.node}`;
const dependencies = digest(['package.json', 'pnpm-lock.yaml', '.nvmrc']);
const definitions = {
  eslint: { config: /(^eslint\.config\.|prettier|tsconfig)/, source: /\.(tsx?|[cm]?jsx?|json)$/ },
  types: { config: /(^tsconfig|^next\.config)/, source: /\.(tsx?|[cm]?jsx?|json)$/ },
  next: {
    config: /(^next\.config|^tsconfig|^postcss\.config|^babel\.)/,
    source: /^(src\/|app\/|messages\/|public\/)/,
  },
};
for (const [name, { config, source }] of Object.entries(definitions)) {
  const prefix = `v2-${runtime}-${name}-${dependencies}-${digest(files.filter((file) => config.test(file)))}-`;
  const key = prefix + digest(files.filter((file) => source.test(file)));
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `${name}_prefix=${prefix}\n${name}_key=${key}\n`);
  else process.stdout.write(`${name}: ${key}\n`);
}
