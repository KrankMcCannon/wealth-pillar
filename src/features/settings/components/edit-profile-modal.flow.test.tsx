import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditProfileModal } from './edit-profile-modal';
import { updateUserProfileAction } from '@/features/settings';

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@/i18n/routing', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));
vi.mock('@/features/settings', () => ({ updateUserProfileAction: vi.fn() }));
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: clerkUser }),
  useReverification: (callback: unknown) => callback,
}));

const address = {
  id: 'new-email',
  emailAddress: 'new@example.com',
  verification: { status: 'unverified' },
  prepareVerification: vi.fn(),
  attemptVerification: vi.fn(),
};
const clerkUser = {
  emailAddresses: [],
  primaryEmailAddressId: 'old-email',
  createEmailAddress: vi.fn(),
  update: vi.fn(),
};
beforeEach(() => {
  vi.clearAllMocks();
  clerkUser.createEmailAddress.mockResolvedValue(address);
  address.attemptVerification.mockResolvedValue({
    ...address,
    verification: { status: 'verified' },
  });
  clerkUser.update.mockResolvedValue({ primaryEmailAddressId: address.id });
  vi.mocked(updateUserProfileAction).mockResolvedValue({
    data: { id: 'u1', name: 'Ivan', email: 'new@example.com' },
    error: null,
  });
});

describe('profile email verification form', () => {
  it('waits for OTP verification and Clerk promotion before saving and closing', async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    render(
      <EditProfileModal
        isOpen
        onClose={close}
        userId="u1"
        currentName="Ivan"
        currentEmail="old@example.com"
      />
    );
    await user.clear(screen.getByLabelText('emailLabel'));
    await user.type(screen.getByLabelText('emailLabel'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: 'saveChangesButton' }));
    await waitFor(() => expect(address.prepareVerification).toHaveBeenCalled());
    expect(updateUserProfileAction).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('verificationCodeLabel'), '123456');
    await user.click(screen.getByRole('button', { name: 'verifyAndSaveButton' }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(clerkUser.update).toHaveBeenCalledWith({ primaryEmailAddressId: address.id });
    expect(updateUserProfileAction).toHaveBeenCalledWith('u1', {
      name: undefined,
      email: 'new@example.com',
    });
    expect(address.attemptVerification.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(updateUserProfileAction).mock.invocationCallOrder[0]!
    );
  });
});
