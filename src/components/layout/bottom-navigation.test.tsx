import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BottomNavigation } from './bottom-navigation';

const { pathnameRef, pendingRef } = vi.hoisted(() => ({
  pathnameRef: { current: '/home' },
  pendingRef: { current: false },
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/link', () => ({
  useLinkStatus: () => ({ pending: pendingRef.current }),
}));

vi.mock('@/i18n/routing', () => ({
  usePathname: () => pathnameRef.current,
  Link: ({
    children,
    href,
    className,
    title,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    title?: string;
    'aria-current'?: 'page';
  }) => (
    <a href={href} className={className} title={title} {...props}>
      {children}
    </a>
  ),
}));

describe('BottomNavigation', () => {
  it('marks the current route as the current page without a filled pill', () => {
    pathnameRef.current = '/transactions';
    pendingRef.current = false;
    render(<BottomNavigation />);

    expect(screen.getByRole('navigation', { name: 'ariaNav' })).toBeInTheDocument();

    const current = screen.getByRole('link', { name: 'transactions' });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.className).not.toMatch(/bg-primary\/20/);
    expect(current.className).not.toMatch(/shadow-sm/);
    expect(current.className).toMatch(/active:text-foreground/);
    expect(current.querySelector('[class*="font-semibold"]')).toBeTruthy();

    expect(screen.getByRole('link', { name: 'home' })).not.toHaveAttribute('aria-current');
  });

  it('treats nested budget routes as the Budget tab', () => {
    pathnameRef.current = '/budgets/abc';
    pendingRef.current = false;
    render(<BottomNavigation />);

    expect(screen.getByRole('link', { name: 'budgets' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'home' })).not.toHaveAttribute('aria-current');
  });

  it('paints the pending tab as active before the route commits', () => {
    pathnameRef.current = '/home';
    pendingRef.current = true;
    render(<BottomNavigation />);

    const home = screen.getByRole('link', { name: 'home' });
    expect(home.querySelector('[aria-busy="true"]')).toBeTruthy();
    expect(home.querySelector('[class*="font-semibold"]')).toBeTruthy();
  });
});
