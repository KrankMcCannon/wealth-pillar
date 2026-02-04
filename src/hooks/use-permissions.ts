import { useMemo } from 'react';
import type { User } from '@/lib/types';
import {
  isAdmin,
  isMember,
  isSuperAdmin,
  hasRole,
  canAccessUserData,
  canManageOtherUsers,
  getEffectiveUserId,
  shouldDisableUserField,
  getDefaultFormUserId,
  getUserFieldHelperText,
} from '@/lib/utils/permissions';

interface UsePermissionsProps {
  currentUser: User | null;
  selectedUserId?: string;
}

interface UsePermissionsReturn {
  // Role checks
  isAdmin: boolean;
  isMember: boolean;
  isSuperAdmin: boolean;
  hasRole: (...roles: ('admin' | 'member' | 'superadmin')[]) => boolean;

  // Permission checks
  canManageOtherUsers: boolean;
  canAccessUser: (targetUserId: string) => boolean;

  // Effective values for filtering
  effectiveUserId: string;

  // Form helpers
  shouldDisableUserField: boolean;
  defaultFormUserId: string;
  userFieldHelperText: string | undefined;
}

/**
 * Custom hook for permission checks
 * Provides memoized permission utilities for optimal performance
 * All permission logic is centralized in @/lib/utils/permissions
 *
 * @example
 * ```tsx
 * const { isAdmin, isMember, effectiveUserId, shouldDisableUserField } = usePermissions({
 *   currentUser,
 *   selectedUserId,
 * });
 *
 * // Use in filtering
 * const filteredData = data.filter(item =>
 *   isMember ? item.user_id === currentUser.id : true
 * );
 *
 * // Use in forms
 * <UserField disabled={shouldDisableUserField} />
 * ```
 */
export function usePermissions({
  currentUser,
  selectedUserId,
}: UsePermissionsProps): UsePermissionsReturn {
  const permissions = useMemo(() => {
    return {
      // Role checks - memoized for performance
      isAdmin: isAdmin(currentUser),
      isMember: isMember(currentUser),
      isSuperAdmin: isSuperAdmin(currentUser),
      hasRole: (...roles: ('admin' | 'member' | 'superadmin')[]) => hasRole(currentUser, ...roles),

      // Permission checks
      canManageOtherUsers: canManageOtherUsers(currentUser),
      canAccessUser: (targetUserId: string) => canAccessUserData(currentUser, targetUserId),

      // Effective values for data filtering
      effectiveUserId: getEffectiveUserId(currentUser, selectedUserId),

      // Form helpers
      shouldDisableUserField: shouldDisableUserField(currentUser),
      defaultFormUserId: getDefaultFormUserId(currentUser, selectedUserId),
      userFieldHelperText: getUserFieldHelperText(currentUser),
    };
  }, [currentUser, selectedUserId]);

  return permissions;
}
