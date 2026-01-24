/**
 * Cached Auth Utilities
 *
 * Provides request-scoped caching for authentication operations.
 * Uses React's cache() function to deduplicate auth calls within a single request.
 *
 * This eliminates redundant database calls when multiple server actions
 * or components need to check authentication in the same request.
 *
 * @module lib/auth/cached-auth
 */

import { cache } from 'react';
import { auth } from '@clerk/nextjs/server';
import { UserService, GroupService } from '@/server/services';
import type { User } from '@/lib/types';

/**
 * Request-scoped cached auth
 *
 * Wraps Clerk's auth() function with React's cache() to ensure
 * it's only called once per request, regardless of how many
 * components or server actions need authenticated user info.
 *
 * @returns Promise with userId (clerkId) or null if not authenticated
 */
export const getAuth = cache(async () => {
  return auth();
});

/**
 * Request-scoped cached current user
 *
 * Fetches the current user from the database with request-level deduplication.
 * Combines getAuth() + UserService.getLoggedUserInfo() into a single cached call.
 *
 * @returns Promise with User object or null if not authenticated/not found
 *
 * @example
 * // In a server action
 * export async function myAction() {
 *   const currentUser = await getCurrentUser();
 *   if (!currentUser) {
 *     return { error: 'Non autenticato' };
 *   }
 *   // Use currentUser...
 * }
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const { userId: clerkId } = await getAuth();

  if (!clerkId) {
    return null;
  }

  const user = await UserService.getLoggedUserInfo(clerkId);
  return user as unknown as User | null;
});

/**
 * Require authenticated user
 *
 * Helper that throws if user is not authenticated.
 * Useful for actions that always require authentication.
 *
 * @throws Error if not authenticated
 * @returns Promise with authenticated User
 *
 * @example
 * export async function protectedAction() {
 *   const user = await requireUser();
 *   // user is guaranteed to exist here
 * }
 */
export const requireUser = cache(async (): Promise<User> => {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Non autenticato. Effettua il login per continuare.');
  }

  return user;
});

/**
 * Request-scoped cached group users
 *
 * Fetches all users in the current user's group with request-level deduplication.
 * Returns empty array if user has no group.
 *
 * @returns Promise with array of User objects in the group
 */
export const getGroupUsers = cache(async (): Promise<User[]> => {
  const user = await getCurrentUser();

  if (!user?.group_id) {
    return [];
  }

  const groupUsers = await GroupService.getGroupUsers(user.group_id);
  return (groupUsers || []) as unknown as User[];
});
