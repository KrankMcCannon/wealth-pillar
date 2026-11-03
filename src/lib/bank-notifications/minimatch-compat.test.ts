import { createRequire } from 'node:module';
import { expect, it } from 'vitest';
const require = createRequire(import.meta.url);
it('preserves the callable ESLint API using the patched matching engine', () => {
  const match = createRequire(require.resolve('eslint'))('minimatch');
  expect(match('src/app.ts', 'src/**/*.ts')).toBe(true);
  expect(match('src/app.ts', '**/*.js')).toBe(false);
  expect(new match.Minimatch('**/*.tsx').match('src/form.tsx')).toBe(true);
  expect(match.filter('*.ts')('app.ts')).toBe(true);
  expect(match.defaults({ dot: true })('.config', '*')).toBe(true);
  expect(match.makeRe('src/*.ts').test('src/app.ts')).toBe(true);
});
