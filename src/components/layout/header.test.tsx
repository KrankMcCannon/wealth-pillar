import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './header';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const push = vi.fn();
const back = vi.fn();

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push, back }),
  usePathname: () => '/home',
}));

describe('Header', () => {
  it('does not render a user picker on the dashboard header', () => {
    render(<Header />);

    expect(screen.getByRole('heading', { name: 'appName' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'aria.userPicker' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'aria.back' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'aria.settings' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'appName' }).previousElementSibling).toHaveAttribute(
      'aria-hidden'
    );
  });

  it('renders a back control on inner pages', () => {
    render(<Header title="Accounts" showBack />);

    expect(screen.getByRole('heading', { name: 'Accounts' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'aria.back' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'aria.userPicker' })).not.toBeInTheDocument();
  });

  it('does not flash the app name before a page title is ready', () => {
    render(<Header ready={false} />);

    expect(screen.queryByRole('heading', { name: 'appName' })).not.toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveAttribute('aria-busy', 'true');
  });
});
