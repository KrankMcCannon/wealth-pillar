import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export default defineConfig({
  dialect: 'postgresql',
  out: './src/server/db/drizzle',
  schema: './src/server/db/schema.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL!.replace('6543', '5432'),
  },
  verbose: true,
  strict: true,
});
