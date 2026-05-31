import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateGroupAction } from './actions';

vi.mock('@/lib/auth/cached-auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/server/use-cases/groups/groups.use-cases', () => ({
  updateGroupUseCase: vi.fn(),
}));

import { getCurrentUser } from '@/lib/auth/cached-auth';
import { updateGroupUseCase } from '@/server/use-cases/groups/groups.use-cases';

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
