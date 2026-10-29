import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const include = [
  'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
  'app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
];
const serverTests = 'src/{server,lib}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  test: {
    pool: 'threads',
    // Preserve per-file isolation; only browser-dependent suites pay for jsdom.
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          setupFiles: ['./src/test/setup-server.ts'],
          include: [serverTests],
          exclude: configDefaults.exclude,
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          include,
          exclude: [...configDefaults.exclude, serverTests],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/unit',
    },
  },
});
