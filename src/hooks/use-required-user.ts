/**
 * Required User Hooks
 *
 */

import { useUserContext } from '@/providers/user-provider';
import type { User } from '@/lib/types';

/**
 * Get the current user (non-nullable)
 *
 */
export function useRequiredCurrentUser(): User {
  const { currentUser } = useUserContext();
  return currentUser;
}

/**
 * Get the current user's group ID (non-nullable)
 *
 */
export function useRequiredGroupId(): string {
  const { currentUser } = useUserContext();

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
 */
export function useRequiredGroupUsers(): User[] {
  const { groupUsers } = useUserContext();
  return groupUsers;
}
