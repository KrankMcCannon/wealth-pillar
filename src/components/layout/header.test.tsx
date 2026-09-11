import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './header';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const push = vi.fn();
const back = vi.fn();

const searchParamsHolder = { current: new URLSearchParams() };

vi.mock('next/link', () => ({
  useLinkStatus: () => ({ pending: false }),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParamsHolder.current,
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push, back }),
  usePathname: () => '/home',
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Header', () => {
  beforeEach(() => {
    searchParamsHolder.current = new URLSearchParams();
  });

  it('does not render a user picker on the dashboard header', () => {
    render(<Header />);

    expect(screen.getByRole('heading', { name: 'appName' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'aria.userPicker' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'aria.back' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'aria.settings' })).toHaveAttribute(
      'href',
      '/settings'
    );
    expect(screen.getByRole('heading', { name: 'appName' }).previousElementSibling).toHaveAttribute(
      'aria-hidden'
    );
  });

  it('renders a history-back button when no href is known', () => {
    render(<Header title="Accounts" showBack />);

    expect(screen.getByRole('heading', { name: 'Accounts' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'aria.back' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'aria.userPicker' })).not.toBeInTheDocument();
  });

  it('renders back as a prefetchable link when backHref is set', () => {
    render(<Header title="Settings" backHref="/home" />);

    expect(screen.getByRole('link', { name: 'aria.back' })).toHaveAttribute('href', '/home');
    expect(screen.queryByRole('button', { name: 'aria.back' })).not.toBeInTheDocument();
  });

  it('uses the from query when the page does not pass backHref', () => {
    searchParamsHolder.current = new URLSearchParams('from=%2Fbudgets%2Fb1');
    render(<Header title="Transactions" />);

    expect(screen.getByRole('link', { name: 'aria.back' })).toHaveAttribute(
      'href',
      '/budgets/b1'
    );
  });

  it('prefers an explicit backHref over the from query', () => {
    searchParamsHolder.current = new URLSearchParams('from=%2Fbudgets%2Fb1');
    render(<Header title="Period" backHref="/reports" />);

    expect(screen.getByRole('link', { name: 'aria.back' })).toHaveAttribute('href', '/reports');
  });

  it('does not flash the app name before a page title is ready', () => {
    render(<Header ready={false} />);

    expect(screen.queryByRole('heading', { name: 'appName' })).not.toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveAttribute('aria-busy', 'true');
  });
});
