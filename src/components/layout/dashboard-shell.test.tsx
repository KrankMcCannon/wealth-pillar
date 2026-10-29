import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardShell } from '@/components/layout/dashboard-shell';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/layout/bottom-navigation', () => ({
  BottomNavigation: () => <nav aria-label="bottom-nav">Bottom Nav</nav>,
}));

vi.mock('@/components/layout/header', () => ({
  Header: ({ title }: { title?: string }) => (
    <header data-testid="dashboard-header">{title ?? 'appName'}</header>
  ),
}));

vi.mock('@/components/layout/dashboard-route-warmer', () => ({
  DashboardRouteWarmer: () => null,
}));

describe('DashboardShell', () => {
  it('renders persistent header, children, and bottom navigation', () => {
    render(
      <DashboardShell>
        <main>Page content</main>
      </DashboardShell>
    );

    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'bottom-nav' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'skipToContent' })).toHaveAttribute(
      'href',
      '#content-start'
    );
  });
});
