import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateGroupAction,
  updateUserProfileAction,
  updateUserPreferencesAction,
  sendGroupInvitationAction,
} from './actions';

vi.mock('@/lib/auth/cached-auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/server/use-cases/groups/groups.use-cases', () => ({
  updateGroupUseCase: vi.fn(),
}));

vi.mock('@/server/use-cases/users/user.use-cases', () => ({
  updateUserProfileUseCase: vi.fn(),
}));

vi.mock('@/server/use-cases/users/get-user-preferences.use-case', () => ({
  updateUserPreferencesUseCase: vi.fn(),
}));

vi.mock('@/server/use-cases/groups/group-invitations.use-cases', () => ({
  createGroupInvitationUseCase: vi.fn(),
}));

import { getCurrentUser } from '@/lib/auth/cached-auth';
import { updateGroupUseCase } from '@/server/use-cases/groups/groups.use-cases';
import { updateUserProfileUseCase } from '@/server/use-cases/users/user.use-cases';
import { updateUserPreferencesUseCase } from '@/server/use-cases/users/get-user-preferences.use-case';
import { createGroupInvitationUseCase } from '@/server/use-cases/groups/group-invitations.use-cases';

describe('updateGroupAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-admin users', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'u1',
      group_id: 'g1',
      role: 'member',
    } as never);

    const result = await updateGroupAction('g1', 'New name');

    expect(result.error).toBe('Permission denied');
    expect(updateGroupUseCase).not.toHaveBeenCalled();
  });

  it('updates group name for admin in same group', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'u1',
      group_id: 'g1',
      role: 'admin',
    } as never);
    vi.mocked(updateGroupUseCase).mockResolvedValue({ id: 'g1', name: 'Famiglia Rossi' } as never);

    const result = await updateGroupAction('g1', 'Famiglia Rossi');

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ id: 'g1', name: 'Famiglia Rossi' });
    expect(updateGroupUseCase).toHaveBeenCalledWith('g1', { name: 'Famiglia Rossi' });
  });
});

describe('updateUserProfileAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects updates for another user', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'u1',
      group_id: 'g1',
      role: 'member',
    } as never);

    const result = await updateUserProfileAction('u2', { name: 'Hacker' });

    expect(result.error).toBe('Permission denied');
    expect(updateUserProfileUseCase).not.toHaveBeenCalled();
  });
});

describe('sendGroupInvitationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-admin users', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'u1',
      group_id: 'g1',
      role: 'member',
    } as never);

    const result = await sendGroupInvitationAction('g1', 'u1', 'invitee@example.com');

    expect(result.error).toBe('Permission denied');
    expect(createGroupInvitationUseCase).not.toHaveBeenCalled();
  });
});

describe('updateUserPreferencesAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated callers', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const result = await updateUserPreferencesAction('u1', { currency: 'EUR' });

    expect(result.error).toBe('Not authenticated');
    expect(updateUserPreferencesUseCase).not.toHaveBeenCalled();
  });
});
