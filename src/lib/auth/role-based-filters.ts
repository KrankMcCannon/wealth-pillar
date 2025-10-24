/**
 * Role-Based Data Filtering Utilities
 * Centralized logic for filtering data based on user roles and permissions
 * Follows DRY principle - eliminates duplicate filtering logic across hooks
 */

import { User } from "../types";

/**
 * Filter data by user role and selection
 * @param data - Array of items with user_id property
 * @param currentUser - Currently authenticated user
 * @param selectedViewUserId - Selected user ID or 'all' for group view
 * @returns Filtered data based on role permissions
 */
export function filterDataByUserRole<T extends { user_id: string }>(
  data: T[],
  currentUser: User,
  selectedViewUserId: string | 'all',
): T[] {
  const role = currentUser.role;

  // Member: can only see their own data
  if (role === 'member') {
    return data.filter(item => item.user_id === currentUser.id);
  }

  // Admin and Superadmin: can see group data
  if (role === 'admin' || role === 'superadmin') {
    // If 'all' is selected, show all users in the group
    if (selectedViewUserId === 'all') {
      // Filter by group_id would require joining with users table
      // For now, return all data (caller should pre-filter by group)
      return data;
    }

    // If specific user selected, filter by that user
    if (selectedViewUserId && selectedViewUserId !== currentUser.id) {
      return data.filter(item => item.user_id === selectedViewUserId);
    }

    // Default: show current user's data
    return data.filter(item => item.user_id === currentUser.id);
  }

  // Fallback: only show current user's data
  return data.filter(item => item.user_id === currentUser.id);
}

/**
 * Filter users list based on role permissions
 * @param allUsers - Complete list of users
 * @param currentUser - Currently authenticated user
 * @param userGroupId - Group ID of the current user
 * @returns Filtered list of users based on role
 */
export function filterUsersByRole(
  allUsers: User[],
  currentUser: User,
  userGroupId: string
): User[] {
  const role = currentUser.role;

  // Member: can only see themselves
  if (role === 'member') {
    return allUsers.filter(user => user.id === currentUser.id);
  }

  // Admin: can see all users in their group
  if (role === 'admin') {
    return allUsers.filter(user => user.group_id === userGroupId);
  }

  // Superadmin: can see all users
  if (role === 'superadmin') {
    return allUsers; // No filtering for superadmin
  }

  // Fallback: only show current user
  return allUsers.filter(user => user.id === currentUser.id);
}

/**
 * Check if user has permission to view specific user's data
 * @param currentUser - Currently authenticated user
 * @param targetUserId - ID of user whose data is being accessed
 * @param userGroupId - Group ID of the current user
 * @param targetUserGroupId - Group ID of the target user
 * @returns true if user has permission to view data
 */
export function canViewUserData(
  currentUser: User,
  targetUserId: string,
  userGroupId: string,
  targetUserGroupId?: string
): boolean {
  const role = currentUser.role;

  // User can always see their own data
  if (currentUser.id === targetUserId) {
    return true;
  }

  // Member: can only see their own data
  if (role === 'member') {
    return false;
  }

  // Admin: can see data from users in same group
  if (role === 'admin') {
    return targetUserGroupId === userGroupId;
  }

  // Superadmin: can see all data
  if (role === 'superadmin') {
    return true;
  }

  // Default: deny access
  return false;
}

/**
 * Get appropriate user ID for queries based on role and selection
 * @param currentUser - Currently authenticated user
 * @param selectedViewUserId - Selected user ID or 'all'
 * @returns User ID to use for filtering, or undefined for 'all'
 */
export function getQueryUserId(
  currentUser: User,
  selectedViewUserId: string | 'all'
): string | undefined {
  const role = currentUser.role;

  // Member: always use their own ID
  if (role === 'member') {
    return currentUser.id;
  }

  // Admin/Superadmin with 'all' selected
  if ((role === 'admin' || role === 'superadmin') && selectedViewUserId === 'all') {
    return undefined; // Return undefined to indicate no user filter
  }

  // Admin/Superadmin with specific user selected
  if ((role === 'admin' || role === 'superadmin') && selectedViewUserId) {
    return selectedViewUserId;
  }

  // Default: use current user ID
  return currentUser.id;
}
