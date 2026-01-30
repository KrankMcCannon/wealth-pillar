import 'server-only';
import { cache } from 'react';
import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { groupCacheKeys } from '@/lib/cache/keys';
import { supabase } from '@/server/db/supabase';
import { UserService } from './user.service';
import { revalidateTag } from 'next/cache';
import type { Database } from '@/lib/types/database.types';
import { validateRequiredString, validateNonEmptyArray } from '@/lib/utils/validation-utils';

type Group = Database['public']['Tables']['groups']['Row'];
type GroupInsert = Database['public']['Tables']['groups']['Insert'];
type GroupUpdate = Database['public']['Tables']['groups']['Update'];
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
 */
export class GroupService {
  // ================== DATABASE OPERATIONS (inlined from repository) ==================

  private static readonly getByIdDb = cache(async (id: string): Promise<Group | null> => {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as Group;
  });

  private static async createDb(data: GroupInsert): Promise<Group> {
    const { data: created, error } = await supabase
      .from('groups')
      .insert(data as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as Group;
  }

  private static async updateDb(id: string, data: GroupUpdate): Promise<Group> {
    const { data: updated, error } = await supabase
      .from('groups')
      .update(data as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as Group;
  }

  private static async deleteDb(id: string): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  // ================== SERVICE LAYER ==================

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
        const group = await this.getByIdDb(groupId);
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
        const users = await UserService.getUsersByGroup(groupId);
        return users;
      },
      groupCacheKeys.users(groupId),
      cacheOptions.groupUsers(groupId)
    );

    const users = await getCachedUsers();

    return (users || []) as unknown as User[];
  }

  /**
   * Creates a new group with the provided users.
   */
  static async createGroup(input: CreateGroupInput): Promise<Group> {
    // Validation using shared utilities
    const name = validateRequiredString(input.name, 'Group name');
    validateNonEmptyArray(input.userIds, 'user');

    const createData = {
      id: input.id,
      name,
      description: input.description?.trim() || '',
      user_ids: input.userIds,
      plan: (input.plan ?? {
        type: 'free',
        name: 'Free Plan',
      }) as Database['public']['Tables']['groups']['Insert']['plan'],
      is_active: input.isActive ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const group = await this.createDb(createData);
    if (!group) throw new Error('Failed to create group');

    const createdGroup = group as unknown as Group;

    revalidateTag(CACHE_TAGS.GROUPS, 'max');
    revalidateTag(CACHE_TAGS.GROUP(createdGroup.id), 'max');
    revalidateTag(CACHE_TAGS.GROUP_USERS(createdGroup.id), 'max');

    return createdGroup;
  }
}
