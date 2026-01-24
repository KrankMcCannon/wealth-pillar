import 'server-only';
import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { groupCacheKeys } from '@/lib/cache/keys';
import { GroupRepository, UserRepository } from '@/server/dal';
import { revalidateTag } from 'next/cache';
import type { Database } from '@/lib/types/database.types';

type Group = Database['public']['Tables']['groups']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export interface CreateGroupInput {
  id?: string;
  name: string;
  description?: string;
  userIds: string[];
  plan?: Record<string, unknown>;
  isActive?: boolean;
}

/**
 * Group Service
 * Handles all group-related business logic following Single Responsibility Principle
 *
 * All methods throw standard errors instead of returning ServiceResult objects
 * All database queries are cached using Next.js unstable_cache
 */
export class GroupService {
  /**
    * Retrieves group information by ID
    */
  static async getGroupById(groupId: string): Promise<Group> {
    if (!groupId || groupId.trim() === '') {
      throw new Error('Group ID is required');
    }

    // Create cached query function
    const getCachedGroup = cached(
      async () => {
        const group = await GroupRepository.getById(groupId);
        return group;
      },
      groupCacheKeys.byId(groupId),
      cacheOptions.group(groupId)
    );

    const group = await getCachedGroup();

    if (!group) {
      throw new Error('Group not found');
    }

    return group as unknown as Group;
  }

  /**
   * Retrieves all users in a group
   */
  static async getGroupUsers(groupId: string): Promise<User[]> {
    if (!groupId || groupId.trim() === '') {
      throw new Error('Group ID is required');
    }

    // Create cached query function
    const getCachedUsers = cached(
      async () => {
        const users = await UserRepository.getByGroup(groupId);
        return users;
      },
      groupCacheKeys.users(groupId),
      cacheOptions.groupUsers(groupId)
    );

    const users = await getCachedUsers();

    return (users || []) as unknown as User[];
  }

  /**
   * Gets the count of users in a group
   */
  static async getGroupUserCount(groupId: string): Promise<number> {
    if (!groupId || groupId.trim() === '') {
      throw new Error('Group ID is required');
    }

    const count = await UserRepository.countByGroup(groupId);

    return count;
  }

  /**
   * Gets users by role within a group
   */
  static async getUsersByRole(
    groupId: string,
    role: 'superadmin' | 'admin' | 'member'
  ): Promise<User[]> {
    if (!groupId || groupId.trim() === '') {
      throw new Error('Group ID is required');
    }

    const users = await UserRepository.getByGroupAndRole(groupId, role);

    return (users || []) as unknown as User[];
  }

  /**
   * Checks if a group exists
   */
  static async groupExists(groupId: string): Promise<boolean> {
    if (!groupId || groupId.trim() === '') return false;
    try {
      const group = await GroupRepository.getById(groupId);
      return !!group;
    } catch {
      return false;
    }
  }

  /**
   * Gets group details with user count
   */
  static async getGroupWithUserCount(
    groupId: string
  ): Promise<{ group: Group; userCount: number }> {
    if (!groupId || groupId.trim() === '') {
      throw new Error('Group ID is required');
    }

    // Fetch group and user count in parallel for better performance
    const [group, userCount] = await Promise.all([
      this.getGroupById(groupId),
      this.getGroupUserCount(groupId),
    ]);

    return {
      group,
      userCount,
    };
  }

  /**
   * Creates a new group with the provided users.
   */
  static async createGroup(input: CreateGroupInput): Promise<Group> {
    if (!input.name || input.name.trim() === '') {
      throw new Error('Group name is required');
    }

    if (!input.userIds || input.userIds.length === 0) {
      throw new Error('At least one user is required to create a group');
    }

    const createData = {
      id: input.id,
      name: input.name.trim(),
      description: input.description?.trim() || '',
      user_ids: input.userIds,
      plan: (input.plan) as any ?? {
        type: 'free',
        name: 'Free Plan',
      },
      is_active: input.isActive ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const group = await GroupRepository.create(createData);

    if (!group) throw new Error('Failed to create group');

    const createdGroup = group as unknown as Group;

    revalidateTag(CACHE_TAGS.GROUPS, 'max');
    revalidateTag(CACHE_TAGS.GROUP(createdGroup.id), 'max');
    revalidateTag(CACHE_TAGS.GROUP_USERS(createdGroup.id), 'max');

    return createdGroup;
  }
}
