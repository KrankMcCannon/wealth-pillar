import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureClerkIdentityStubUseCase } from './user.use-cases';
import { UsersRepository } from '@/server/repositories/users.repository';

vi.mock('@/server/repositories/users.repository', () => ({
  UsersRepository: {
    findByClerkId: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/utils/serializer', () => ({
  serialize: (v: unknown) => v,
}));

describe('ensureClerkIdentityStubUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns existing user without creating', async () => {
    vi.mocked(UsersRepository.findByClerkId).mockResolvedValue({
      id: 'u1',
      clerk_id: 'clerk_1',
    } as never);

    const result = await ensureClerkIdentityStubUseCase({
      clerkId: 'clerk_1',
      email: 'a@b.com',
      name: 'Ada',
    });

    expect(result?.id).toBe('u1');
    expect(UsersRepository.create).not.toHaveBeenCalled();
  });

  it('creates stub when clerk id is new', async () => {
    vi.mocked(UsersRepository.findByClerkId).mockResolvedValue(null);
    vi.mocked(UsersRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(UsersRepository.create).mockResolvedValue({
      id: 'u-new',
      clerk_id: 'clerk_1',
      email: 'a@b.com',
    } as never);

    const result = await ensureClerkIdentityStubUseCase({
      clerkId: 'clerk_1',
      email: 'a@b.com',
      name: 'Ada',
    });

    expect(result?.id).toBe('u-new');
    expect(UsersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clerk_id: 'clerk_1',
        email: 'a@b.com',
        name: 'Ada',
        role: 'member',
      })
    );
  });
});
