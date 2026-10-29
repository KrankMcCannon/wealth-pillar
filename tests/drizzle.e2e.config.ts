import { defineConfig } from 'drizzle-kit';
// Export-only configuration; never loads the application's .env or contacts a database.
export default defineConfig({ dialect: 'postgresql', schema: './src/server/db/schema.ts' });
