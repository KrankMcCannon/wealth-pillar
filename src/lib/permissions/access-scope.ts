import type { User } from '@/lib/types';
import { isAdmin } from '@/lib/utils/permissions';

export interface OwnedResource {
  user_id: string | null;
}

export interface SharedResource {
  user_ids: string[];
}

/**
 * Request-scoped visibility for data owned by one or many users.
 * Create once per request: `AccessScope.for(currentUser)`.
 */
export class AccessScope {
  readonly viewerId: string;
  readonly isAdmin: boolean;
  private readonly visibleUserIds: Set<string>;

  private constructor(user: User) {
    this.viewerId = user.id;
    this.isAdmin = isAdmin(user);
    this.visibleUserIds = new Set([user.id]);
  }

  static for(user: User): AccessScope {
    return new AccessScope(user);
  }

  canViewUser(id: string | null | undefined): boolean {
    return !!id && (this.isAdmin || this.visibleUserIds.has(id));
  }

  canViewOwned(resource: OwnedResource): boolean {
    return this.canViewUser(resource.user_id);
  }

  canViewShared(resource: SharedResource): boolean {
    return this.isAdmin || resource.user_ids.some((id) => this.visibleUserIds.has(id));
  }

  filterOwned<T extends OwnedResource>(items: T[]): T[] {
    return this.isAdmin ? items : items.filter((item) => this.canViewOwned(item));
  }

  filterShared<T extends SharedResource>(items: T[]): T[] {
    return this.isAdmin ? items : items.filter((item) => this.canViewShared(item));
  }

  pickUserRecord<T>(record: Record<string, T>): Record<string, T> {
    if (this.isAdmin) return record;
    const value = record[this.viewerId];
    return value !== undefined ? { [this.viewerId]: value } : {};
  }
}
