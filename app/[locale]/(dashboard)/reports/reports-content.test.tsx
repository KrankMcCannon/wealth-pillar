import { Suspense } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/lib/types';
import type { ReportsPageData } from '@/server/use-cases/pages/reports-page.use-case';
import ReportsContent from './reports-content';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', async () => {
  const { useSyncExternalStore } = await import('react');
  return {
    useSearchParams: () =>
      new URLSearchParams(
        useSyncExternalStore(
          (listener) => {
            window.addEventListener('popstate', listener);
            return () => window.removeEventListener('popstate', listener);
          },
          () => window.location.search
        )
      ),
  };
});
vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/reports',
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useFormatter: () => ({ dateTimeRange: () => 'range' }),
}));
vi.mock('@/hooks/use-page-header', () => ({ usePageHeader: () => undefined }));
vi.mock('@/components/layout', () => ({
  HomeDashboardMain: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock('@/components/shared/user-selector', () => ({
  default: ({ onChange, value }: { onChange: (value: string) => void; value: string }) => (
    <>
      <output aria-label="Selected member">{value}</output>
      <button onClick={() => onChange('member-9')}>Select member</button>
    </>
  ),
}));
vi.mock('@/features/reports/components/reports-time-filter', () => ({
  ReportsTimeFilter: ({
    onChange,
    children,
  }: {
    onChange: (value: string) => void;
    children: React.ReactNode;
  }) => (
    <div>
      <button onClick={() => onChange('weekly')}>Weekly</button>
      {children}
    </div>
  ),
}));
vi.mock('@/features/reports/components/reports-hero', () => ({ ReportsHero: () => null }));
vi.mock('@/features/reports/components/reserve-section', () => ({ ReserveSection: () => null }));
vi.mock('@/features/reports/components/top-expenses-ranking', () => ({
  TopExpensesRanking: () => null,
}));
vi.mock('@/features/reports/components/account-breakdown-section', () => ({
  AccountBreakdownSection: () => null,
}));
vi.mock('@/features/reports/components/report-periods-details', () => ({
  ReportPeriodsDetails: ({
    hrefForPeriod,
  }: {
    hrefForPeriod: (period: { id: string }) => string;
  }) => <a href={hrefForPeriod({ id: 'closed-1' })}>Period</a>,
}));

const data = {
  sections: { all: {}, 'member-9': {}, viewer: {} },
  defaultScope: 'all',
  currentWindow: { start: '2026-10-01', end: '2026-10-31' },
  comparisonWindow: null,
} as unknown as ReportsPageData;

async function mountReports(role: User['role'] = 'admin') {
  const bundle = Promise.resolve(data);
  let view!: ReturnType<typeof render>;
  await act(async () => {
    view = render(
      <Suspense fallback="loading">
        <ReportsContent
          currentUser={{ id: 'viewer', role } as User}
          groupUsers={[{ id: 'member-9' } as User, { id: 'viewer' } as User]}
          reportsBundlePromise={bundle}
          initialPreset="monthly"
        />
      </Suspense>
    );
  });
  return view;
}

describe('Reports insights navigation', () => {
  beforeEach(() => {
    push.mockClear();
    window.history.replaceState(null, '', '/it/reports?preset=monthly');
    // Next integrates the native history API with useSearchParams.
    for (const method of ['pushState', 'replaceState'] as const) {
      const original = window.history[method].bind(window.history);
      vi.spyOn(window.history, method).mockImplementation((...args) => {
        original(...args);
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
    }
  });
  afterEach(() => vi.restoreAllMocks());

  it('serializes opening/closing, preserves locale and retains expansion through member and time changes', async () => {
    await mountReports();
    fireEvent.click(screen.getByText('insightsTitle'));
    await waitFor(() => expect(window.location.search).toContain('periods=open'));
    expect(window.location.pathname).toBe('/it/reports');
    expect(screen.getByRole('link', { name: 'Period' })).toHaveAttribute(
      'href',
      expect.stringContaining('periods=open')
    );
    fireEvent.click(screen.getByRole('button', { name: 'Select member' }));
    expect(window.location.search).toContain('member=member-9');
    expect(window.location.search).toContain('periods=open');
    expect(window.location.pathname).toBe('/it/reports');
    fireEvent.click(screen.getByRole('button', { name: 'Weekly' }));
    expect(push).toHaveBeenCalledWith('/reports?preset=weekly&member=member-9&periods=open', {
      scroll: false,
    });
    fireEvent.click(screen.getByText('insightsTitle'));
    await waitFor(() => expect(window.location.search).not.toContain('periods='));
    expect(screen.queryByRole('link', { name: 'Period' })).toBeNull();
  });

  it('restores expansion from a shared URL and follows browser back/forward navigation', async () => {
    window.history.replaceState(null, '', '/it/reports?preset=monthly&periods=open');
    await mountReports();
    expect(screen.getByRole('link', { name: 'Period' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('insightsTitle'));
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Period' })).toBeNull());
    act(() => window.history.back());
    await waitFor(() => expect(screen.getByRole('link', { name: 'Period' })).toBeInTheDocument());
    act(() => window.history.forward());
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Period' })).toBeNull());
  });

  it('restores the selected person as well as expansion across native history entries', async () => {
    await mountReports();
    fireEvent.click(screen.getByText('insightsTitle'));
    await waitFor(() => expect(window.location.search).toContain('periods=open'));
    fireEvent.click(screen.getByRole('button', { name: 'Select member' }));
    expect(screen.getByLabelText('Selected member')).toHaveTextContent('member-9');
    act(() => window.history.back());
    await waitFor(() => expect(window.location.search).not.toContain('member='));
    expect(screen.getByLabelText('Selected member')).toHaveTextContent('all');
    act(() => window.history.forward());
    await waitFor(() => expect(window.location.search).toContain('member=member-9'));
    expect(screen.getByLabelText('Selected member')).toHaveTextContent('member-9');
  });

  it('ignores unknown people in shared URLs and keeps members scoped to themselves', async () => {
    window.history.replaceState(null, '', '/it/reports?preset=monthly&member=foreign-user');
    const view = await mountReports();
    expect(screen.getByLabelText('Selected member')).toHaveTextContent('all');
    view.unmount();
    await mountReports('member');
    expect(screen.getByLabelText('Selected member')).toHaveTextContent('viewer');
    fireEvent.click(screen.getByRole('button', { name: 'Select member' }));
    expect(screen.getByLabelText('Selected member')).toHaveTextContent('viewer');
  });
});
