import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { test as teardown } from '@playwright/test';
import { authFile, fixtureFile } from './e2e-environment';
import { fixtureDatabase } from './e2e-database';

teardown('remove only the owned local fixture database contents', async () => {
  if (!existsSync(fixtureFile)) return;
  const db = fixtureDatabase();
  try {
    await db.unsafe(
      'DROP SCHEMA public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS auth CASCADE; DROP SCHEMA IF EXISTS extensions CASCADE; DROP SCHEMA IF EXISTS wealth_pillar_migrations CASCADE; DROP ROLE IF EXISTS anon; DROP ROLE IF EXISTS authenticated; DROP ROLE IF EXISTS service_role; DROP ROLE IF EXISTS pool_user;'
    );
  } finally {
    await db.end();
    await rm(authFile, { force: true });
    await rm(fixtureFile, { force: true });
  }
});
