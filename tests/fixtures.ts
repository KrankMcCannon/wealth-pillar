import { randomUUID } from 'node:crypto';
import { test as base, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { fixtureDatabase } from './e2e-database';
import { readFixture } from './e2e-environment';

export const test = base.extend<{ transaction: { id: string; description: string } }>({
  transaction: async ({ page: _page }, provideTransaction) => {
    const fixture = readFixture();
    const id = randomUUID();
    const description = `E2E Own ${id}`;
    const db = fixtureDatabase();
    try {
      await db`insert into transactions (id,description,amount,type,category,date,account_id,user_id,group_id)
        values (${id},${description},10,'expense','e2e_food',CURRENT_DATE,${fixture.accountId},${fixture.userId},${fixture.groupId})`;
      await provideTransaction({ id, description });
    } finally {
      await db`delete from transactions where id = ${id}`;
      await db.end();
    }
  },
});
test.beforeEach(async ({ page }) => {
  await setupClerkTestingToken({ page });
});
export { expect };
