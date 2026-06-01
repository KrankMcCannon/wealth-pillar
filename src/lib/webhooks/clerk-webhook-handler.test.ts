import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleClerkWebhook } from './clerk-webhook-handler';

vi.mock('@/server/use-cases/users/user.use-cases', () => ({
  ensureClerkIdentityStubUseCase: vi.fn(),
  getUserByClerkIdUseCase: vi.fn(),
  updateUserProfileUseCase: vi.fn(),
  deleteUserUseCase: vi.fn(),
}));

import {
  ensureClerkIdentityStubUseCase,
  getUserByClerkIdUseCase,
  updateUserProfileUseCase,
  deleteUserUseCase,
} from '@/server/use-cases/users/user.use-cases';

describe('handleClerkWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates identity stub on user.created', async () => {
    await handleClerkWebhook({
      type: 'user.created',
      data: {
        id: 'clerk_1',
        email_addresses: [{ id: 'em_1', email_address: 'a@b.com' }],
        primary_email_address_id: 'em_1',
        first_name: 'Ada',
        last_name: 'Lovelace',
      },
    } as never);

    expect(ensureClerkIdentityStubUseCase).toHaveBeenCalledWith({
      clerkId: 'clerk_1',
      email: 'a@b.com',
      name: 'Ada Lovelace',
    });
  });

  it('updates profile on user.updated when user exists', async () => {
    vi.mocked(getUserByClerkIdUseCase).mockResolvedValue({
      id: 'u1',
      email: 'old@b.com',
      name: 'Old',
    } as never);

    await handleClerkWebhook({
      type: 'user.updated',
      data: {
        id: 'clerk_1',
        email_addresses: [{ id: 'em_1', email_address: 'new@b.com' }],
        primary_email_address_id: 'em_1',
        first_name: 'New',
        last_name: 'Name',
      },
    } as never);

    expect(updateUserProfileUseCase).toHaveBeenCalledWith('u1', {
      name: 'New Name',
      email: 'new@b.com',
    });
  });

  it('deletes user on user.deleted when found', async () => {
    vi.mocked(getUserByClerkIdUseCase).mockResolvedValue({ id: 'u1' } as never);

    await handleClerkWebhook({
      type: 'user.deleted',
      data: { id: 'clerk_1' },
    } as never);

    expect(deleteUserUseCase).toHaveBeenCalledWith('u1');
  });
});
