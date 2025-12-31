import { CACHE_TAGS, cached, cacheOptions, groupCacheKeys } from '@/lib/cache';
import { supabaseServer } from '@/lib/database/server';
import type { Database } from '@/lib/database/types';
import { nowISO } from '@/lib/utils/date-utils';
import type { ServiceResult } from './user.service';

async function revalidateCacheTags(tags: string[]) {
  if (globalThis.window === undefined) {
    const { revalidateTag } = await import('next/cache');
    for (const tag of tags) {
      revalidateTag(tag, 'max');
    }
  }
}

/**
 * Group and User types from database
 */
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
 * All methods return ServiceResult for consistent error handling
 * All database queries are cached using Next.js unstable_cache
 */
export class GroupService {
  /**
   * Retrieves group information by ID
   * Includes group details like name, plan, and settings
   *
   * @param groupId - Group ID
   * @returns Group data or error
   *
   * @example
   * const { data: group, error } = await GroupService.getGroupById(groupId);
   * if (error) {
   *   console.error('Failed to get group:', error);
   * }
   */
  static async getGroupById(groupId: string): Promise<ServiceResult<Group>> {
    try {
      // Input validation
      if (!groupId || groupId.trim() === '') {
        return {
          data: null,
          error: 'Group ID is required',
        };
      }

      // Create cached query function
      const getCachedGroup = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .single();

          if (error) {
            throw new Error(error.message);
          }

          return data;
        },
        groupCacheKeys.byId(groupId),
        cacheOptions.group(groupId)
      );

      const group = await getCachedGroup();

      if (!group) {
        return {
          data: null,
          error: 'Group not found',
        };
      }

      return {
        data: group as Group,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve group information',
      };
    }
  }

  /**
   * Retrieves all users in a group
   * Essential for displaying team members, permissions, and collaboration features
   *
   * @param groupId - Group ID
   * @returns Array of users in the group or error
   *
   * @example
   * const { data: users, error } = await GroupService.getGroupUsers(groupId);
   * if (data) {
   *   console.log(`Group has ${data.length} members`);
   * }
   */
  static async getGroupUsers(
    groupId: string
  ): Promise<ServiceResult<User[]>> {
    try {
      // Input validation
      if (!groupId || groupId.trim() === '') {
        return {
          data: null,
          error: 'Group ID is required',
        };
      }

      // Create cached query function
      const getCachedUsers = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('users')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: true });

          if (error) {
            throw new Error(error.message);
          }

          return data || [];
        },
        groupCacheKeys.users(groupId),
        cacheOptions.groupUsers(groupId)
      );

      const users = await getCachedUsers();

      return {
        data: users as User[],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve group users',
      };
    }
  }

  /**
   * Gets the count of users in a group
   * Lightweight query for displaying member count
   *
   * @param groupId - Group ID
   * @returns Number of users in group
   *
   * @example
   * const { data: count } = await GroupService.getGroupUserCount(groupId);
   */
  static async getGroupUserCount(
    groupId: string
  ): Promise<ServiceResult<number>> {
    try {
      if (!groupId || groupId.trim() === '') {
        return {
          data: null,
          error: 'Group ID is required',
        };
      }

      const { data, error } = await supabaseServer
        .from('users')
        .select('id')
        .eq('group_id', groupId);

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: data?.length ?? 0,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve user count',
      };
    }
  }

  /**
   * Gets users by role within a group
   * Useful for permission checks and role-based UI
   *
   * @param groupId - Group ID
   * @param role - User role (superadmin, admin, member)
   * @returns Array of users with specified role
   *
   * @example
   * const { data: admins } = await GroupService.getUsersByRole(groupId, 'admin');
   */
  static async getUsersByRole(
    groupId: string,
    role: 'superadmin' | 'admin' | 'member'
  ): Promise<ServiceResult<User[]>> {
    try {
      if (!groupId || groupId.trim() === '') {
        return {
          data: null,
          error: 'Group ID is required',
        };
      }

      const { data, error } = await supabaseServer
        .from('users')
        .select('*')
        .eq('group_id', groupId)
        .eq('role', role)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: (data || []) as User[],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve users by role',
      };
    }
  }

  /**
   * Checks if a group exists
   * Lightweight check without fetching full group data
   *
   * @param groupId - Group ID
   * @returns Boolean indicating if group exists
   *
   * @example
   * const exists = await GroupService.groupExists(groupId);
   */
  static async groupExists(groupId: string): Promise<boolean> {
    try {
      if (!groupId || groupId.trim() === '') {
        return false;
      }

      const { data, error } = await supabaseServer
        .from('groups')
        .select('id')
        .eq('id', groupId)
        .single();

      return !error && data !== null;
    } catch {
      return false;
    }
  }

  /**
   * Gets group details with user count
   * Combines group data with member count for dashboard displays
   *
   * @param groupId - Group ID
   * @returns Group data with user count
   *
   * @example
   * const { data } = await GroupService.getGroupWithUserCount(groupId);
   * console.log(`${data.group.name} has ${data.userCount} members`);
   */
  static async getGroupWithUserCount(
    groupId: string
  ): Promise<ServiceResult<{ group: Group; userCount: number }>> {
    try {
      if (!groupId || groupId.trim() === '') {
        return {
          data: null,
          error: 'Group ID is required',
        };
      }

      // Fetch group and user count in parallel for better performance
      const [groupResult, countResult] = await Promise.all([
        this.getGroupById(groupId),
        this.getGroupUserCount(groupId),
      ]);

      if (groupResult.error) {
        return {
          data: null,
          error: groupResult.error,
        };
      }

      if (countResult.error) {
        return {
          data: null,
          error: countResult.error,
        };
      }

      return {
        data: {
          group: groupResult.data!,
          userCount: countResult.data!,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve group with user count',
      };
    }
  }

  /**
   * Creates a new group with the provided users.
   */
  static async createGroup(input: CreateGroupInput): Promise<ServiceResult<Group>> {
    try {
      if (!input.name || input.name.trim() === '') {
        return { data: null, error: 'Group name is required' };
      }

      if (!input.userIds || input.userIds.length === 0) {
        return { data: null, error: 'At least one user is required to create a group' };
      }

      const now = nowISO();
      const insertData: Database['public']['Tables']['groups']['Insert'] = {
        id: input.id,
        name: input.name.trim(),
        description: input.description?.trim() || '',
        user_ids: input.userIds,
        plan: input.plan ?? { type: 'free', name: 'Free Plan' },
        is_active: input.isActive ?? true,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabaseServer
        .from('groups')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        return { data: null, error: 'Failed to create group' };
      }

      const createdGroup = data as Group;

      await revalidateCacheTags([
        CACHE_TAGS.GROUPS,
        CACHE_TAGS.GROUP(createdGroup.id),
        CACHE_TAGS.GROUP_USERS(createdGroup.id),
      ]);

      return { data: createdGroup, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create group',
      };
    }
  }
}
