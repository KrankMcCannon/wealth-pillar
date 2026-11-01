import { asc, gt } from 'drizzle-orm';
import { db } from '../src/server/db/drizzle';
import { investments } from '../src/server/db/schema';
import { persistPortfolioSnapshotsUseCase } from '../src/server/use-cases/investments/persist-portfolio-snapshots.use-case';

async function main() {
  let cursor: string | undefined;
  let failures = 0;
  try {
    do {
      const users = await db
        .selectDistinct({ id: investments.user_id })
        .from(investments)
        .where(cursor ? gt(investments.user_id, cursor) : undefined)
        .orderBy(asc(investments.user_id))
        .limit(100);
      if (!users.length) break;
      for (const user of users) {
        try {
          const { saved } = await persistPortfolioSnapshotsUseCase(user.id);
          process.stdout.write(`Portfolio rebuilt: ${saved} complete daily points\n`);
        } catch {
          failures++;
          console.error('Portfolio rebuild failed; will retry on the next run');
        }
      }
      cursor = users.at(-1)!.id;
    } while (true);
  } finally {
    await db.$client.end();
  }
  if (failures) process.exitCode = 1;
}

main().catch(() => {
  console.error('Portfolio snapshot job failed');
  process.exitCode = 1;
});
