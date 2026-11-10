import { defineConfig } from 'vitest/config';
import integration from './vitest.integration.config';

export default defineConfig({
  ...integration,
  test: {
    ...integration.test,
    include: ['scripts/db/benchmark.test.ts'],
    testTimeout: 900_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
});
