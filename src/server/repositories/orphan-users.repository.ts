import { resolveDb } from './db-executor';
import { orphanUsers } from '@/server/db/schema';

export class OrphanUsersRepository {
  static async register(clerkId: string): Promise<void> {
    await resolveDb().insert(orphanUsers).values({ clerk_id: clerkId });
  }
}
