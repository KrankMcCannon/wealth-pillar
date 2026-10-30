import { beforeEach, expect, it, vi } from 'vitest';
import { getCurrentUser } from '@/lib/auth/cached-auth';
import { deleteInvestmentUseCase } from '@/server/use-cases';
import { invalidateInvestmentCaches } from '@/lib/utils/cache-utils';
import { deleteInvestmentAction } from './investment-actions';
vi.mock('@/lib/auth/cached-auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/server/use-cases', () => ({ deleteInvestmentUseCase: vi.fn() }));
vi.mock('@/lib/utils/cache-utils', () => ({ invalidateInvestmentCaches: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
it('rejects unauthenticated deletion', async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  expect((await deleteInvestmentAction('entry')).error).toBe('UNAUTHENTICATED');
  expect(deleteInvestmentUseCase).not.toHaveBeenCalled();
});
it('passes only the authenticated owner to the atomic deletion', async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ id: 'owner', group_id: 'group' } as NonNullable<
    Awaited<ReturnType<typeof getCurrentUser>>
  >);
  vi.mocked(deleteInvestmentUseCase).mockResolvedValue(null);
  expect((await deleteInvestmentAction('entry')).error).toBe('NOT_FOUND');
  expect(deleteInvestmentUseCase).toHaveBeenCalledWith('entry', 'owner');
  expect(invalidateInvestmentCaches).not.toHaveBeenCalled();
});
it('invalidates portfolio caches after a successful scoped deletion', async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ id: 'owner', group_id: 'group' } as NonNullable<
    Awaited<ReturnType<typeof getCurrentUser>>
  >);
  vi.mocked(deleteInvestmentUseCase).mockResolvedValue({ id: 'entry' } as NonNullable<
    Awaited<ReturnType<typeof deleteInvestmentUseCase>>
  >);
  expect(await deleteInvestmentAction('entry')).toEqual({ data: true, error: null });
  expect(invalidateInvestmentCaches).toHaveBeenCalledWith({ groupId: 'group', userId: 'owner' });
});
