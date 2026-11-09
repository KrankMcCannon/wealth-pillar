import { expect, it } from 'vitest';
import { validateDatabaseUrl } from './connection-config';

it.each([
  'postgres://user:secret@aws-0-eu.pooler.supabase.com:5432/postgres',
  'postgres://user:secret@db.example:6543/postgres',
  'postgres://user:secret@db.example/postgres?sslmode=disable',
  'postgres://user:secret@db.example/postgres?host=pooler.example',
])('rejects a pooler or insecure override without exposing credentials', (url) => {
  expect(() => validateDatabaseUrl(url)).toThrow();
  try {
    validateDatabaseUrl(url);
  } catch (error) {
    expect(String(error)).not.toContain('secret');
  }
});

it('accepts provider direct URLs and isolated local databases without rewriting', () => {
  for (const value of [
    'postgres://user:secret@db.ref.supabase.co:5432/postgres',
    'postgres://localhost:55439/wealth_pillar_test',
  ]) {
    expect(validateDatabaseUrl(value).href).toBe(value);
  }
});
