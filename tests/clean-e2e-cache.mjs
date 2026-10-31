import { rmSync } from 'node:fs';
// Every test run creates new household IDs for the same Clerk test user. A
// persisted Next.js user cache must never point at the previous disposable DB.
rmSync(new URL('../.next/cache', import.meta.url), { recursive: true, force: true });
