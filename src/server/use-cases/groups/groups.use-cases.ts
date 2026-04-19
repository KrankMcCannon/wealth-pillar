import { GroupsRepository } from '@/server/repositories/groups.repository';
import { UsersRepository } from '@/server/repositories/users.repository';
import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { groupCacheKeys } from '@/lib/cache/keys';
import { revalidateTag } from 'next/cache';
import { serialize } from '@/lib/utils/serializer';
import { validateRequiredString, validateNonEmptyArray } from '@/lib/utils/validation-utils';
import type { Database } from '@/lib/types/database.types';

type Group = Database['public']['Tables']['groups']['Row'];

export interface CreateGroupInput {
  id?: string;
  name: string;
  description?: string;
  userIds: string[];
  plan?: Record<string, unknown>;
  isActive?: boolean;
}

export async function getGroupByIdUseCase(groupId: string): Promise<Group> {
  if (!groupId?.trim()) throw new Error('Group ID is required');

  const getCachedGroup = cached(
    async () => {
      return await GroupsRepository.getById(groupId);
    },
    groupCacheKeys.byId(groupId),
    cacheOptions.group(groupId)
  );

  const group = await getCachedGroup();
  if (!group) throw new Error('Group not found');

  return serialize(group) as unknown as Group;
}

export async function getGroupUsersUseCase(groupId: string) {
  if (!groupId?.trim()) throw new Error('Group ID is required');

  const getCachedUsers = cached(
    async () => {
      // Internal users repository call
      return await UsersRepository.findByGroupId(groupId);
    },
    groupCacheKeys.users(groupId),
    cacheOptions.groupUsers(groupId)
  );

  const users = await getCachedUsers();
  return serialize(users || []);
}

export async function createGroupUseCase(input: CreateGroupInput): Promise<Group> {
  const name = validateRequiredString(input.name, 'Group name');
  validateNonEmptyArray(input.userIds, 'user');

  const createData = {
    ...(input.id && { id: input.id }),
    name,
    description: input.description?.trim() || '',
    user_ids: input.userIds,
    plan: input.plan || { name: 'Free Plan', type: 'free' },
    is_active: input.isActive ?? true,
  };

  const group = await GroupsRepository.create(
    createData as Parameters<typeof GroupsRepository.create>[0]
  );
  if (!group) throw new Error('Failed to create group');

  revalidateTag(CACHE_TAGS.GROUPS, 'max');
  revalidateTag(CACHE_TAGS.GROUP(group.id), 'max');
  revalidateTag(CACHE_TAGS.GROUP_USERS(group.id), 'max');

  return serialize(group) as unknown as Group;
}

export async function deleteGroupUseCase(groupId: string): Promise<void> {
  if (!groupId?.trim()) throw new Error('Group ID is required');

  await GroupsRepository.delete(groupId);

  revalidateTag(CACHE_TAGS.GROUPS, 'max');
  revalidateTag(CACHE_TAGS.GROUP(groupId), 'max');
  revalidateTag(CACHE_TAGS.GROUP_USERS(groupId), 'max');
}
