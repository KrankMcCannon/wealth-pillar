import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { validateDatabaseUrl } from './src/server/db/connection-config';

dotenv.config({ path: '.env' });

const adminUrl = process.env.DATABASE_ADMIN_URL;
if (!adminUrl) throw new Error('DATABASE_ADMIN_URL is required for database administration');
validateDatabaseUrl(adminUrl, 'DATABASE_ADMIN_URL');

export default defineConfig({
  dialect: 'postgresql',
  out: './src/server/db/baseline',
  schema: './src/server/db/schema.ts',
  dbCredentials: {
    url: adminUrl,
  },
  verbose: true,
  strict: true,
});
