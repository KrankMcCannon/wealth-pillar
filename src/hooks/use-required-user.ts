/**
 * Required User Hooks
 *
 * Provides non-nullable access to current user and group data.
 * These hooks should only be used in components that are rendered after authentication
 * and store initialization (i.e., all dashboard pages).
 *
 * If the store is not initialized, these hooks will throw an error indicating a
 * programming error (component rendered before store initialization).
 */

import { useCurrentUser, useGroupUsers } from '@/stores/reference-data-store';
import type { User } from '@/lib/types';

/**
 * Get the current user (non-nullable)
 *
 * This hook guarantees a User object is returned. It should only be used in components
 * that are rendered after the store has been initialized with user data.
 *
 * @throws Error if currentUser is null (indicates store not initialized)
 * @returns Current user object
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const currentUser = useRequiredCurrentUser();
 *   // currentUser is guaranteed to be User, not User | null
 *   console.log(currentUser.id);
 * }
 * ```
 */
export function useRequiredCurrentUser(): User {
  const currentUser = useCurrentUser();

  if (!currentUser) {
    throw new Error(
      'useRequiredCurrentUser: currentUser is null. ' +
      'This indicates the component is rendering before the store is initialized. ' +
      'Ensure the parent page component initializes the store with user data.'
    );
  }

  return currentUser;
}

/**
 * Get the current user's group ID (non-nullable)
 *
 * This hook guarantees a string group ID is returned.
 *
 * @throws Error if currentUser is null or group_id is missing
 * @returns Group ID string
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const groupId = useRequiredGroupId();
 *   // groupId is guaranteed to be string, not string | null
 * }
 * ```
 */
export function useRequiredGroupId(): string {
  const currentUser = useRequiredCurrentUser();

  if (!currentUser.group_id) {
    throw new Error(
      'useRequiredGroupId: currentUser.group_id is null. ' +
      'This indicates data corruption - all users must have a group_id.'
    );
  }

  return currentUser.group_id;
}

/**
 * Get all group users (non-nullable array)
 *
 * Returns an array of users in the current user's group.
 * The array is guaranteed to be non-null but may be empty.
 *
 * @returns Array of group users (may be empty)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const groupUsers = useRequiredGroupUsers();
 *   // groupUsers is User[], never null
 * }
 * ```
 */
export function useRequiredGroupUsers(): User[] {
  const groupUsers = useGroupUsers();
  return groupUsers || [];
}
