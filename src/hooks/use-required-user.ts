/**
 * Required User Hooks
 *
 * Use these for granular subscriptions: useRequiredCurrentUser only
 * re-renders when currentUser changes; useRequiredGroupUsers only when
 * groupUsers changes.
 */

import { useCurrentUser, useGroupUsers } from '@/providers/user-provider';
import type { User } from '@/lib/types';

/**
 * Get the current user (non-nullable). Subscribes only to currentUser context.
 */
export function useRequiredCurrentUser(): User {
  const currentUser = useCurrentUser();
  if (!currentUser) {
    throw new Error('useRequiredCurrentUser must be used within a UserProvider');
  }
  return currentUser;
}

/**
 * Get the current user's group ID (non-nullable). Subscribes only to currentUser.
 */
export function useRequiredGroupId(): string {
  const currentUser = useCurrentUser();
  if (!currentUser) {
    throw new Error('useRequiredGroupId must be used within a UserProvider');
  }
  if (!currentUser.group_id) {
    throw new Error(
      'useRequiredGroupId: currentUser.group_id is null. ' +
        'This indicates data corruption - all users must have a group_id.'
    );
  }
  return currentUser.group_id;
}

/**
 * Get all group users (non-nullable array). Subscribes only to groupUsers context.
 */
export function useRequiredGroupUsers(): User[] {
  const groupUsers = useGroupUsers();
  if (!groupUsers) {
    throw new Error('useRequiredGroupUsers must be used within a UserProvider');
  }
  return groupUsers;
}
