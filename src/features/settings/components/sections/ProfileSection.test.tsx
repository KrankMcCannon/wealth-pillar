import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileSection } from './ProfileSection';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    key === 'avatarAriaLabel' ? `Avatar for ${values?.name ?? ''}` : key,
}));

const user = {
  id: 'u1',
  name: 'Alex Mercer',
  email: 'alex@example.com',
  role: 'admin',
} as const;

describe('ProfileSection', () => {
  it('renders profile info and calls onEditProfile', () => {
    const onEditProfile = vi.fn();
    render(
      <ProfileSection currentUser={user as never} userInitials="AM" onEditProfile={onEditProfile} />
    );

    expect(screen.getByText('Alex Mercer')).toBeInTheDocument();
    expect(screen.getByText('alex@example.com')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'editButton' }));
    expect(onEditProfile).toHaveBeenCalledOnce();
  });
});
