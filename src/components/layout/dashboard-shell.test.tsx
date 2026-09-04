import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardShell } from '@/components/layout/dashboard-shell';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/providers/user-provider', () => ({
  useCurrentUser: () => ({ id: 'u1', name: 'Alex Mercer', role: 'member' }),
}));

vi.mock('@/components/layout/bottom-navigation', () => ({
  BottomNavigation: () => <nav aria-label="bottom-nav">Bottom Nav</nav>,
}));

vi.mock('@/components/layout/header', () => ({
  Header: ({ title, isDashboard }: { title?: string; isDashboard?: boolean }) => (
    <header data-testid="dashboard-header">{isDashboard ? 'Dashboard' : title}</header>
  ),
}));

vi.mock('@/components/layout/page-container', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
