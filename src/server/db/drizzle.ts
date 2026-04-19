import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Suppress max connection warnings by using standard pooling options
// Supabase pooling best practice: use session pooling string or simply let postgres handle it.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
