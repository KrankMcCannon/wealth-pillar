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
    render(<Header isDashboard />);

    expect(screen.getByRole('heading', { name: 'appName' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'aria.userPicker' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'aria.back' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'aria.settings' })).toBeInTheDocument();
  });

  it('renders a back control on inner pages', () => {
    render(<Header title="Accounts" showBack />);

    expect(screen.getByRole('heading', { name: 'Accounts' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'aria.back' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'aria.userPicker' })).not.toBeInTheDocument();
  });
});
