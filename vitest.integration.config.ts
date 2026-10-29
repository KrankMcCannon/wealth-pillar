import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Integration fixtures may only write to a dedicated local test database.
const url = new URL(process.env.DATABASE_URL ?? 'postgres://invalid/invalid');
if (
  !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
  url.pathname !== '/wealth_pillar_test'
) {
  throw new Error('Set DATABASE_URL to a local PostgreSQL database named wealth_pillar_test');
}

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    fileParallelism: false,
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
