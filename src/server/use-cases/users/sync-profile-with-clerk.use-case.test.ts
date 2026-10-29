import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/lib/types';
import { clerkClient } from '@clerk/nextjs/server';
import { updateUserProfileUseCase } from './user.use-cases';
import { syncProfileWithClerkUseCase } from './sync-profile-with-clerk.use-case';

vi.mock('@clerk/nextjs/server', () => ({ clerkClient: vi.fn() }));
vi.mock('./user.use-cases', () => ({ updateUserProfileUseCase: vi.fn() }));
const user = { id: 'u1', clerk_id: 'clerk-1', name: 'Old', email: 'old@example.com' } as User;
const verified = () => ({
  firstName: 'Clerk',
  lastName: 'Name',
  primaryEmailAddressId: 'e1',
  emailAddresses: [
    { id: 'e1', emailAddress: 'verified@example.com', verification: { status: 'verified' } },
  ],
});
const getUser = vi.fn();
const updateUser = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue(verified());
  updateUser.mockImplementation(async (_id, data) => ({ ...verified(), ...data }));
  vi.mocked(clerkClient).mockResolvedValue({ users: { getUser, updateUser } } as never);
});

describe('Clerk-owned profile identity', () => {
  it('persists a verified primary address, reading identity from Clerk', async () => {
    await syncProfileWithClerkUseCase(user, { email: 'verified@example.com' });
    expect(getUser).toHaveBeenCalledWith('clerk-1');
    expect(updateUserProfileUseCase).toHaveBeenCalledWith('u1', {
      email: 'verified@example.com',
      name: 'Clerk Name',
    });
  });

  it('rejects an arbitrary email that is not the verified primary', async () => {
    await expect(
      syncProfileWithClerkUseCase(user, { email: 'forged@example.com' })
    ).rejects.toThrow();
    expect(updateUserProfileUseCase).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('rejects unverified primary addresses', async () => {
    const identity = verified();
    identity.emailAddresses[0]!.verification.status = 'unverified';
    getUser.mockResolvedValue(identity);
    await expect(
      syncProfileWithClerkUseCase(user, { email: 'verified@example.com' })
    ).rejects.toThrow();
    expect(updateUserProfileUseCase).not.toHaveBeenCalled();
  });

  it('updates the name in Clerk before saving it locally', async () => {
    await syncProfileWithClerkUseCase(user, { name: 'New Full Name' });
    expect(updateUser).toHaveBeenCalledWith('clerk-1', {
      firstName: 'New Full Name',
      lastName: '',
    });
    expect(updateUserProfileUseCase).toHaveBeenCalledWith('u1', {
      name: 'New Full Name',
      email: 'verified@example.com',
    });
  });

  it('does not report local success when Clerk fails', async () => {
    getUser.mockRejectedValueOnce(new Error('Clerk unavailable'));
    await expect(syncProfileWithClerkUseCase(user, { name: 'Name' })).rejects.toThrow(
      'Clerk unavailable'
    );
    expect(updateUserProfileUseCase).not.toHaveBeenCalled();
  });
});
