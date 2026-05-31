import { describe, it, expect, vi } from 'vitest';
import React, { Suspense, type ComponentProps } from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import type { RecurringTransactionSeries } from '@/lib/types';
import { RecurrentTabPanel } from './recurrent-tab-panel';

vi.mock('@/features/recurring', () => ({
  RecurringSeriesSection: ({
    series,
    selectedUserId,
  }: {
    series: RecurringTransactionSeries[];
    selectedUserId?: string;
  }) => (
    <div data-testid="recurring-section" data-user={selectedUserId ?? 'all'}>
      {series.length} series
    </div>
  ),
}));

vi.mock('./transaction-skeletons', () => ({
  RecurringSeriesSkeleton: () => <div data-testid="recurring-skeleton" />,
}));

vi.mock('./user-filter-chip-row', () => ({
  UserFilterChipRow: () => <div data-testid="user-filter" />,
}));

const mockSeries: RecurringTransactionSeries[] = [
  {
    id: 'series-1',
    description: 'Rent',
    amount: 800,
    type: 'expense',
    category: 'housing',
    frequency: 'monthly',
    user_ids: ['user-1'],
    account_id: 'account-1',
    start_date: '2024-01-01',
    end_date: null,
    due_day: 1,
    is_active: true,
    total_executions: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

function renderPanel(
  recurringSeriesPromise: Promise<RecurringTransactionSeries[]>,
  overrides?: Partial<ComponentProps<typeof RecurrentTabPanel>>
) {
  return render(
    <RecurrentTabPanel
      isActive
      recurringSeriesPromise={recurringSeriesPromise}
      groupUsers={[]}
      onUserFilterChange={vi.fn()}
      showUserPicker={false}
      onCreateRecurringSeries={vi.fn()}
      onEditRecurringSeries={vi.fn()}
      {...overrides}
    />
  );
}

describe('RecurrentTabPanel', () => {
  it('renders nothing when tab is inactive', () => {
    const { container } = render(
      <RecurrentTabPanel
        isActive={false}
        recurringSeriesPromise={Promise.resolve(mockSeries)}
        groupUsers={[]}
        onUserFilterChange={vi.fn()}
        showUserPicker={false}
        onCreateRecurringSeries={vi.fn()}
        onEditRecurringSeries={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('resolves server promise and renders recurring section', async () => {
    await act(async () => {
      renderPanel(Promise.resolve(mockSeries));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId('recurring-section')).toHaveTextContent('1 series');
    });
  });

  it('passes selected user filter to recurring section', async () => {
    await act(async () => {
      renderPanel(Promise.resolve(mockSeries), {
        selectedUserId: 'user-1',
        showUserPicker: true,
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-filter')).toBeInTheDocument();
      expect(screen.getByTestId('recurring-section')).toHaveAttribute('data-user', 'user-1');
    });
  });

  it('shows skeleton while promise is pending', () => {
    renderPanel(new Promise<RecurringTransactionSeries[]>(() => undefined));

    expect(screen.getByTestId('recurring-skeleton')).toBeInTheDocument();
  });

  it('surfaces rejected promise via error boundary', async () => {
    class TestErrorBoundary extends React.Component<
      { children: React.ReactNode },
      { hasError: boolean }
    > {
      state = { hasError: false };

      static getDerivedStateFromError() {
        return { hasError: true };
      }

      render() {
        if (this.state.hasError) {
          return <div data-testid="recurring-error">failed</div>;
        }
        return this.props.children;
      }
    }

    await act(async () => {
      render(
        <TestErrorBoundary>
          <Suspense fallback={<div data-testid="recurring-skeleton" />}>
            <RecurrentTabPanel
              isActive
              recurringSeriesPromise={Promise.reject(new Error('load failed'))}
              groupUsers={[]}
              onUserFilterChange={vi.fn()}
              showUserPicker={false}
              onCreateRecurringSeries={vi.fn()}
              onEditRecurringSeries={vi.fn()}
            />
          </Suspense>
        </TestErrorBoundary>
      );
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId('recurring-error')).toBeInTheDocument();
    });
  });
});
