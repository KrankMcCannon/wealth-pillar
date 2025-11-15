import { supabaseServer } from '@/lib/database/server';
import { cached, groupCacheKeys, cacheOptions } from '@/lib/cache';
import type { Database } from '@/lib/database/types';
import type { ServiceResult } from './user.service';

/**
 * Group and User types from database
 */
type Group = Database['public']['Tables']['groups']['Row'];
type User = Database['public']['Tables']['users']['Row'];

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
        data: group,
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
        data: users,
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

      const { count, error } = await supabaseServer
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId);

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: count || 0,
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
        data: data || [],
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
}
