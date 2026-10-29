import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEntityFormPermissions } from './use-entity-form-permissions';

const usePermissionsMock = vi.fn((_args?: unknown) => ({
  shouldDisableUserField: false,
  defaultFormUserId: 'user-2',
  userFieldHelperText: 'Admin helper',
}));

vi.mock('@/hooks', () => ({
  usePermissions: (args: unknown) => usePermissionsMock(args),
  useRequiredCurrentUser: () => ({ id: 'user-1', name: 'Current' }),
  useRequiredGroupUsers: () => [{ id: 'user-1', name: 'Current' }],
  useRequiredGroupId: () => 'group-1',
}));

vi.mock('@/hooks/state/use-user-filter', () => ({
  useUserFilter: () => ({ selectedUserId: 'user-2' }),
}));

describe('useEntityFormPermissions', () => {
  it('forwards permission context from shared hooks', () => {
    const { result } = renderHook(() => useEntityFormPermissions());

    expect(result.current.currentUser.id).toBe('user-1');
    expect(result.current.groupId).toBe('group-1');
    expect(result.current.selectedUserId).toBe('user-2');
    expect(result.current.defaultFormUserId).toBe('user-2');
    expect(result.current.userFieldHelperText).toBe('Admin helper');
    expect(usePermissionsMock).toHaveBeenCalledWith({
      currentUser: expect.objectContaining({ id: 'user-1' }),
      selectedUserId: 'user-2',
    });
  });
});
