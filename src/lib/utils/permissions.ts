import type { User, RoleType } from '@/lib/types';

/**
 * Permission Utilities - Centralized permission logic
 * Following DRY principle with optimized, non-duplicated functions
 */

/**
 * Core role check function - Base for all role-based checks
 * @param user - Current user
 * @param roles - One or more roles to check against
 * @returns true if user has any of the specified roles
 */
export function hasRole(user: User | null, ...roles: RoleType[]): boolean {
  if (!user?.role) return false;
  return roles.includes(user.role);
}

/**
 * Convenience helpers for common role checks
 */
export const isAdmin = (user: User | null) => hasRole(user, 'admin', 'superadmin');
export const isMember = (user: User | null) => hasRole(user, 'member');
export const isSuperAdmin = (user: User | null) => hasRole(user, 'superadmin');

/**
 * Unified permission check - Handles both view and edit permissions
 * Admins can access any user's data, members can only access their own
 *
 * @param currentUser - User performing the action
 * @param targetUserId - User whose data is being accessed
 * @returns true if access is allowed
 */
export function canAccessUserData(currentUser: User | null, targetUserId: string): boolean {
  if (!currentUser) return false;

  // Admins can access anyone's data
  if (isAdmin(currentUser)) return true;

  // Members can only access their own data
  return currentUser.id === targetUserId;
}

/**
 * Check if user can view/manage other users' data
 * Simplified: only admins can access other users' data
 */
export const canManageOtherUsers = (user: User | null): boolean => isAdmin(user);

/**
 * Get effective user ID for data filtering
 * Returns the user ID that should be used for filtering data based on permissions
 *
 * @param currentUser - Current logged-in user
 * @param selectedUserId - User ID selected in UI (for admins)
 * @returns User ID to use for filtering, or 'all' for admins viewing all data
 */
export function getEffectiveUserId(currentUser: User | null, selectedUserId?: string): string {
  if (!currentUser) return 'all';

  // Members can only see their own data
  if (isMember(currentUser)) {
    return currentUser.id;
  }

  // Admins can filter by any user or see all
  return selectedUserId || 'all';
}

/**
 * Filter users list based on permissions
 * Members get empty array (UserSelector will be hidden)
 * Admins get full list
 *
 * @param currentUser - Current logged-in user
 * @param allUsers - Complete list of users in the group
 * @returns Filtered list based on permissions
 */
export function getVisibleUsers(currentUser: User | null, allUsers: User[]): User[] {
  if (!currentUser) return [];

  // Admins see all users
  if (isAdmin(currentUser)) return allUsers;

  // Members see empty list (UserSelector component handles hiding)
  return [];
}

/**
 * Get users available for selection in forms
 * Members can only select themselves, admins can select anyone
 *
 * @param currentUser - Current logged-in user
 * @param allUsers - Complete list of users in the group
 * @returns Users available for selection
 */
export function getSelectableUsers(currentUser: User | null, allUsers: User[]): User[] {
  if (!currentUser) return [];

  // Admins can select any user
  if (isAdmin(currentUser)) return allUsers;

  // Members can only select themselves
  return [currentUser];
}

/**
 * Check if user field should be disabled in forms
 * Members cannot change the user field (always their own ID)
 */
export const shouldDisableUserField = (user: User | null): boolean => isMember(user);

/**
 * Get default user ID for forms
 * Members always use their own ID, admins use selected user or default to themselves
 *
 * @param currentUser - Current logged-in user
 * @param selectedUserId - Pre-selected user ID (from filters)
 * @returns Default user ID to use in forms
 */
export function getDefaultFormUserId(currentUser: User | null, selectedUserId?: string): string {
  if (!currentUser) return '';

  // Members always use their own ID
  if (isMember(currentUser)) return currentUser.id;

  // Admins use selected user or default to themselves
  return selectedUserId || currentUser.id;
}

/**
 * Get helper text for disabled user field
 * Provides user-friendly explanation for members
 */
export function getUserFieldHelperText(user: User | null): string | undefined {
  if (isMember(user)) {
    return 'I membri possono creare e modificare solo i propri dati';
  }
  return undefined;
}

/**
 * Filter data by user based on permissions
 * Generic helper for filtering any array of items with user_id
 *
 * @param items - Array of items with user_id property
 * @param currentUser - Current logged-in user
 * @param selectedUserId - Selected user ID filter
 * @returns Filtered items based on permissions
 */
export function filterByUserPermissions<T extends { user_id: string }>(
  items: T[],
  currentUser: User | null,
  selectedUserId?: string
): T[] {
  if (!currentUser) return [];

  // Members only see their own items
  if (isMember(currentUser)) {
    return items.filter((item) => item.user_id === currentUser.id);
  }

  // Admins see filtered or all items
  if (selectedUserId && selectedUserId !== 'all') {
    return items.filter((item) => item.user_id === selectedUserId);
  }

  return items;
}

/**
 * Check if current route/action requires admin privileges
 * Used for route guards and conditional rendering
 */
export function requiresAdmin(route: string): boolean {
  const adminRoutes = ['/settings/members', '/settings/group', '/admin'];
  return adminRoutes.some((adminRoute) => route.startsWith(adminRoute));
}
