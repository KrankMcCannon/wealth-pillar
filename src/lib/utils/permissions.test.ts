import { describe, it, expect } from 'vitest';
import type { User, RoleType } from '@/lib/types';
import {
  hasRole,
  isAdmin,
  isMember,
  isSuperAdmin,
  canAccessUserData,
  canManageOtherUsers,
  getEffectiveUserId,
  getVisibleUsers,
  getSelectableUsers,
  shouldDisableUserField,
  getDefaultFormUserId,
  getUserFieldHelperText,
  filterByUserPermissions,
  requiresAdmin,
} from './permissions';

// Factory helper for creating test users
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    avatar: null,
    theme_color: null,
    budget_start_date: null,
    group_id: 'group-1',
    role: 'member',
    clerk_id: 'clerk-1',
    default_account_id: null,
    budget_periods: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('permissions', () => {
  describe('hasRole', () => {
    it('should return false for null user', () => {
      expect(hasRole(null, 'member')).toBe(false);
    });

    it('should return false when user has no role', () => {
      const user = createMockUser({ role: null as unknown as RoleType });
      expect(hasRole(user, 'member')).toBe(false);
    });

    it('should return true when user has matching role', () => {
      const user = createMockUser({ role: 'admin' });
      expect(hasRole(user, 'admin')).toBe(true);
    });

    it('should return true when user has one of multiple roles', () => {
      const user = createMockUser({ role: 'admin' });
      expect(hasRole(user, 'member', 'admin')).toBe(true);
    });

    it('should return false when user has non-matching role', () => {
      const user = createMockUser({ role: 'member' });
      expect(hasRole(user, 'admin', 'superadmin')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin role', () => {
      const user = createMockUser({ role: 'admin' });
      expect(isAdmin(user)).toBe(true);
    });

    it('should return true for superadmin role', () => {
      const user = createMockUser({ role: 'superadmin' });
      expect(isAdmin(user)).toBe(true);
    });

    it('should return false for member role', () => {
      const user = createMockUser({ role: 'member' });
      expect(isAdmin(user)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isAdmin(null)).toBe(false);
    });
  });

  describe('isMember', () => {
    it('should return true for member role', () => {
      const user = createMockUser({ role: 'member' });
      expect(isMember(user)).toBe(true);
    });

    it('should return false for admin role', () => {
      const user = createMockUser({ role: 'admin' });
      expect(isMember(user)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isMember(null)).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('should return true for superadmin role', () => {
      const user = createMockUser({ role: 'superadmin' });
      expect(isSuperAdmin(user)).toBe(true);
    });

    it('should return false for admin role', () => {
      const user = createMockUser({ role: 'admin' });
      expect(isSuperAdmin(user)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isSuperAdmin(null)).toBe(false);
    });
  });

  describe('canAccessUserData', () => {
    it('should return false for null user', () => {
      expect(canAccessUserData(null, 'user-2')).toBe(false);
    });

    it('should return true when admin accesses any user data', () => {
      const admin = createMockUser({ id: 'admin-1', role: 'admin' });
      expect(canAccessUserData(admin, 'user-2')).toBe(true);
    });

    it('should return true when member accesses own data', () => {
      const member = createMockUser({ id: 'member-1', role: 'member' });
      expect(canAccessUserData(member, 'member-1')).toBe(true);
    });

    it('should return false when member accesses other user data', () => {
      const member = createMockUser({ id: 'member-1', role: 'member' });
      expect(canAccessUserData(member, 'member-2')).toBe(false);
    });
  });

  describe('canManageOtherUsers', () => {
    it('should return true for admin', () => {
      const admin = createMockUser({ role: 'admin' });
      expect(canManageOtherUsers(admin)).toBe(true);
    });

    it('should return false for member', () => {
      const member = createMockUser({ role: 'member' });
      expect(canManageOtherUsers(member)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(canManageOtherUsers(null)).toBe(false);
    });
  });

  describe('getEffectiveUserId', () => {
    it('should return "all" for null user', () => {
      expect(getEffectiveUserId(null)).toBe('all');
    });

    it('should return member own ID regardless of selection', () => {
      const member = createMockUser({ id: 'member-1', role: 'member' });
      expect(getEffectiveUserId(member, 'user-2')).toBe('member-1');
    });

    it('should return selected user ID for admin', () => {
      const admin = createMockUser({ id: 'admin-1', role: 'admin' });
      expect(getEffectiveUserId(admin, 'user-2')).toBe('user-2');
    });

    it('should return "all" for admin with no selection', () => {
      const admin = createMockUser({ id: 'admin-1', role: 'admin' });
      expect(getEffectiveUserId(admin)).toBe('all');
    });
  });

  describe('getVisibleUsers', () => {
    const allUsers = [
      createMockUser({ id: 'user-1' }),
      createMockUser({ id: 'user-2' }),
    ];

    it('should return empty array for null user', () => {
      expect(getVisibleUsers(null, allUsers)).toEqual([]);
    });

    it('should return all users for admin', () => {
      const admin = createMockUser({ role: 'admin' });
      expect(getVisibleUsers(admin, allUsers)).toEqual(allUsers);
    });

    it('should return empty array for member', () => {
      const member = createMockUser({ role: 'member' });
      expect(getVisibleUsers(member, allUsers)).toEqual([]);
    });
  });

  describe('getSelectableUsers', () => {
    const allUsers = [
      createMockUser({ id: 'user-1' }),
      createMockUser({ id: 'user-2' }),
    ];

    it('should return empty array for null user', () => {
      expect(getSelectableUsers(null, allUsers)).toEqual([]);
    });

    it('should return all users for admin', () => {
      const admin = createMockUser({ role: 'admin' });
      expect(getSelectableUsers(admin, allUsers)).toEqual(allUsers);
    });

    it('should return only current user for member', () => {
      const member = createMockUser({ id: 'member-1', role: 'member' });
      expect(getSelectableUsers(member, allUsers)).toEqual([member]);
    });
  });

  describe('shouldDisableUserField', () => {
    it('should return true for member', () => {
      const member = createMockUser({ role: 'member' });
      expect(shouldDisableUserField(member)).toBe(true);
    });

    it('should return false for admin', () => {
      const admin = createMockUser({ role: 'admin' });
      expect(shouldDisableUserField(admin)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(shouldDisableUserField(null)).toBe(false);
    });
  });

  describe('getDefaultFormUserId', () => {
    it('should return empty string for null user', () => {
      expect(getDefaultFormUserId(null)).toBe('');
    });

    it('should return member own ID', () => {
      const member = createMockUser({ id: 'member-1', role: 'member' });
      expect(getDefaultFormUserId(member, 'user-2')).toBe('member-1');
    });

    it('should return selected ID for admin', () => {
      const admin = createMockUser({ id: 'admin-1', role: 'admin' });
      expect(getDefaultFormUserId(admin, 'user-2')).toBe('user-2');
    });

    it('should return admin own ID when no selection', () => {
      const admin = createMockUser({ id: 'admin-1', role: 'admin' });
      expect(getDefaultFormUserId(admin)).toBe('admin-1');
    });
  });

  describe('getUserFieldHelperText', () => {
    it('should return message for member', () => {
      const member = createMockUser({ role: 'member' });
      expect(getUserFieldHelperText(member)).toBe(
        'I membri possono creare e modificare solo i propri dati'
      );
    });

    it('should return undefined for admin', () => {
      const admin = createMockUser({ role: 'admin' });
      expect(getUserFieldHelperText(admin)).toBeUndefined();
    });

    it('should return undefined for null user', () => {
      expect(getUserFieldHelperText(null)).toBeUndefined();
    });
  });

  describe('filterByUserPermissions', () => {
    const items = [
      { user_id: 'user-1', name: 'Item 1' },
      { user_id: 'user-2', name: 'Item 2' },
      { user_id: 'user-1', name: 'Item 3' },
    ];

    it('should return empty array for null user', () => {
      expect(filterByUserPermissions(items, null)).toEqual([]);
    });

    it('should filter to member own items', () => {
      const member = createMockUser({ id: 'user-1', role: 'member' });
      const result = filterByUserPermissions(items, member);
      expect(result).toHaveLength(2);
      expect(result.every(item => item.user_id === 'user-1')).toBe(true);
    });

    it('should return all items for admin with no selection', () => {
      const admin = createMockUser({ role: 'admin' });
      expect(filterByUserPermissions(items, admin)).toEqual(items);
    });

    it('should filter by selected user for admin', () => {
      const admin = createMockUser({ role: 'admin' });
      const result = filterByUserPermissions(items, admin, 'user-2');
      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe('user-2');
    });

    it('should return all items for admin with "all" selection', () => {
      const admin = createMockUser({ role: 'admin' });
      expect(filterByUserPermissions(items, admin, 'all')).toEqual(items);
    });
  });

  describe('requiresAdmin', () => {
    it('should return true for /settings/members', () => {
      expect(requiresAdmin('/settings/members')).toBe(true);
    });

    it('should return true for /settings/group', () => {
      expect(requiresAdmin('/settings/group')).toBe(true);
    });

    it('should return true for /admin', () => {
      expect(requiresAdmin('/admin')).toBe(true);
    });

    it('should return true for nested admin routes', () => {
      expect(requiresAdmin('/admin/users')).toBe(true);
    });

    it('should return false for non-admin routes', () => {
      expect(requiresAdmin('/dashboard')).toBe(false);
      expect(requiresAdmin('/transactions')).toBe(false);
      expect(requiresAdmin('/settings')).toBe(false);
    });
  });
});
