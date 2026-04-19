import { UsersRepository } from '@/server/repositories/users.repository';
import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { userCacheKeys } from '@/lib/cache/keys';
import { revalidateTag } from 'next/cache';
import { serialize } from '@/lib/utils/serializer';
import { isValidEmail } from '@/lib/utils/validation-utils';
import type { Database } from '@/lib/types/database.types';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];

export async function getUserByIdUseCase(userId: string): Promise<User | null> {
  const getCachedUser = cached(
    async () => await UsersRepository.findById(userId),
    userCacheKeys.byId(userId),
    cacheOptions.user(userId)
  );
  const user = await getCachedUser();
  return user ? (serialize(user) as unknown as User) : null;
}

export async function getUserByClerkIdUseCase(clerkId: string): Promise<User | null> {
  const getCachedUser = cached(
    async () => await UsersRepository.findByClerkId(clerkId),
    userCacheKeys.byClerkId(clerkId),
    cacheOptions.userByClerk(clerkId)
  );
  const user = await getCachedUser();
  return user ? (serialize(user) as unknown as User) : null;
}

export async function createUserUseCase(data: UserInsert): Promise<User> {
  const userInsert = {
    ...data,
    created_at: data.created_at ? new Date(data.created_at) : undefined,
    updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
  };
  const user = await UsersRepository.create(userInsert);
  if (!user) throw new Error('Failed to create user');

  revalidateTag(CACHE_TAGS.USERS, 'max');
  revalidateTag(CACHE_TAGS.USER(user.id), 'max');
  if (user.clerk_id) {
    revalidateTag(CACHE_TAGS.USER_BY_CLERK(user.clerk_id), 'max');
  }

  return serialize(user) as unknown as User;
}

export async function updateUserUseCase(userId: string, data: Partial<UserInsert>): Promise<User> {
  const userUpdate = {
    ...data,
    created_at: data.created_at ? new Date(data.created_at) : undefined,
    updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
  };
  const user = await UsersRepository.update(userId, userUpdate);
  if (!user) throw new Error('Failed to update user');

  revalidateTag(CACHE_TAGS.USERS, 'max');
  revalidateTag(CACHE_TAGS.USER(userId), 'max');
  if (user.clerk_id) {
    revalidateTag(CACHE_TAGS.USER_BY_CLERK(user.clerk_id), 'max');
  }

  return serialize(user) as unknown as User;
}

export async function deleteUserUseCase(userId: string): Promise<void> {
  const user = await UsersRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Sequential deletion (previously handled by UserService)
  const { deleteBudgetsByUserUseCase } = await import('../budgets/delete-budget.use-case');
  const { deleteTransactionsByUserUseCase } =
    await import('../transactions/delete-transaction.use-case');
  const { getAccountsByUserUseCase, deleteAccountUseCase, updateAccountUseCase } =
    await import('../accounts/account.use-cases');

  // 1. Delete budgets
  await deleteBudgetsByUserUseCase(userId);

  // 2. Delete transactions
  await deleteTransactionsByUserUseCase(userId);

  // 3. Handle accounts
  const accounts = await getAccountsByUserUseCase(userId);
  if (accounts) {
    for (const account of accounts) {
      if (account.user_ids.length === 1 && account.user_ids[0] === userId) {
        await deleteAccountUseCase(account.id);
      } else {
        const newUserIds = account.user_ids.filter((id) => id !== userId);
        await updateAccountUseCase(account.id, { user_ids: newUserIds });
      }
    }
  }

  // 4. Delete user record
  await UsersRepository.delete(userId);

  // Invalidate cache
  revalidateTag(CACHE_TAGS.USERS, 'max');
  revalidateTag(CACHE_TAGS.USER(userId), 'max');
  if (user.clerk_id) {
    revalidateTag(CACHE_TAGS.USER_BY_CLERK(user.clerk_id), 'max');
  }
}

export async function getUserByEmailUseCase(email: string): Promise<User | null> {
  const user = await UsersRepository.findByEmail(email);
  return user ? (serialize(user) as unknown as User) : null;
}

export async function getUsersByGroupUseCase(groupId: string): Promise<User[]> {
  const getCachedUsers = cached(
    async () => await UsersRepository.findByGroupId(groupId),
    userCacheKeys.byGroup(groupId),
    cacheOptions.groupUsers(groupId)
  );
  const users = await getCachedUsers();
  return serialize(users || []) as unknown as User[];
}

export async function getUserGroupIdUseCase(userId: string): Promise<string> {
  const user = await getUserByIdUseCase(userId);
  if (!user?.group_id) throw new Error('User group not found');
  return user.group_id;
}

export async function setUserDefaultAccountUseCase(
  userId: string,
  accountId: string | null
): Promise<User> {
  return await updateUserUseCase(userId, { default_account_id: accountId });
}

export async function updateUserProfileUseCase(
  userId: string,
  updates: { name?: string | undefined; email?: string | undefined }
): Promise<User> {
  if (!userId?.trim()) throw new Error('User ID is required');
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('At least one field (name or email) must be provided');
  }

  const updateData: Partial<UserInsert> = {};

  if (updates.name !== undefined) {
    if (updates.name.trim() === '') throw new Error('Name cannot be empty');
    if (updates.name.length > 100) throw new Error('Name must be 100 characters or less');
    updateData.name = updates.name.trim();
  }

  if (updates.email !== undefined) {
    if (!isValidEmail(updates.email)) throw new Error('Invalid email format');
    const emailLower = updates.email.toLowerCase();
    const existingUser = await UsersRepository.findByEmail(emailLower);
    if (existingUser && existingUser.id !== userId) {
      throw new Error('Email is already in use');
    }
    updateData.email = emailLower;
  }

  return await updateUserUseCase(userId, updateData);
}
