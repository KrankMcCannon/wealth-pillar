import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUser } from '@clerk/nextjs';
import { useVerifiedProfileEmail } from './use-verified-profile-email';

vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
  useReverification: (callback: unknown) => callback,
}));
const address = {
  id: 'e-new',
  emailAddress: 'new@example.com',
  verification: { status: 'unverified' },
  prepareVerification: vi.fn(),
  attemptVerification: vi.fn(),
};
const createEmailAddress = vi.fn();
const update = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  address.verification.status = 'unverified';
  createEmailAddress.mockResolvedValue(address);
  address.attemptVerification.mockImplementation(async () => ({
    ...address,
    verification: { status: 'verified' },
  }));
  update.mockResolvedValue({ primaryEmailAddressId: 'e-new' });
  vi.mocked(useUser).mockReturnValue({
    user: { emailAddresses: [], primaryEmailAddressId: 'e-old', createEmailAddress, update },
  } as never);
});

describe('verified profile email', () => {
  it('sends a code first, then promotes only after successful verification', async () => {
    const { result } = renderHook(useVerifiedProfileEmail);
    await act(async () => {
      expect(await result.current.verifyEmail('new@example.com', '')).toBe(false);
    });
    expect(address.prepareVerification).toHaveBeenCalledWith({ strategy: 'email_code' });
    expect(update).not.toHaveBeenCalled();
    expect(result.current.pendingEmail).toBe('new@example.com');
    await act(async () => {
      expect(await result.current.verifyEmail('new@example.com', '123456')).toBe(true);
    });
    expect(address.attemptVerification).toHaveBeenCalledWith({ code: '123456' });
    expect(update).toHaveBeenCalledWith({ primaryEmailAddressId: 'e-new' });
    expect(result.current.pendingEmail).toBeNull();
  });

  it('does not promote an address after an invalid code', async () => {
    const { result } = renderHook(useVerifiedProfileEmail);
    await act(async () => {
      await result.current.verifyEmail('new@example.com', '');
    });
    address.attemptVerification.mockRejectedValueOnce(new Error('Invalid code'));
    await act(async () => {
      await expect(result.current.verifyEmail('new@example.com', 'wrong')).rejects.toThrow();
    });
    expect(update).not.toHaveBeenCalled();
  });
});
