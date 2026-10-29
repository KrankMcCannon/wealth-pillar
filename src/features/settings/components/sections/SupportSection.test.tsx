import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SupportSection } from './SupportSection';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('SupportSection', () => {
  it('renders support links and logout button', () => {
    const onSignOut = vi.fn();
    render(<SupportSection isSigningOut={false} onSignOut={onSignOut} />);

    expect(screen.getByRole('link', { name: /helpCenterLabel/i })).toHaveAttribute(
      'href',
      'helpCenterHref'
    );
    fireEvent.click(screen.getByRole('button', { name: 'logoutLabel' }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('shows signing out label when loading', () => {
    render(<SupportSection isSigningOut onSignOut={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'signingOutLabel' })).toBeDisabled();
  });
});
