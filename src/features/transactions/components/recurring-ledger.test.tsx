import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { RecurringTransactionSeries } from '@/lib/types';
import { RecurringLedger } from './recurring-ledger';
import { CompactSegments } from './filter-dock';
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));
vi.mock('./sticky-total', () => ({
  StickyTotal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
const series: RecurringTransactionSeries = {
  id: 'series',
  description: 'Insurance',
  amount: 120,
  type: 'expense',
  category: 'insurance',
  frequency: 'yearly',
  user_ids: ['u1'],
  account_id: 'a1',
  start_date: '2026-01-01',
  end_date: null,
  due_day: 15,
  is_active: true,
  total_executions: 0,
  created_at: '',
  updated_at: '',
};
const props = {
  selectedUserId: undefined,
  onCreateRecurringSeries: vi.fn(),
  onEditRecurringSeries: vi.fn(),
  accountNames: { a1: 'Household' },
};
describe('Recurring ledger context', () => {
  it('shows frequency and account beside each scheduled amount', () => {
    render(<RecurringLedger {...props} series={[series]} />);
    expect(screen.getByText(/frequency.yearly/)).toHaveTextContent('Household');
    expect(screen.getByText('monthlyEstimate')).toBeVisible();
  });
  it('distinguishes an empty paused filter from having no series and offers recovery', () => {
    render(<RecurringLedger {...props} series={[series]} />);
    fireEvent.click(screen.getByRole('radio', { name: 'statusPaused 0' }));
    expect(screen.getByText('empty.paused')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'showAllSeries' }));
    expect(screen.getByText('Insurance')).toBeVisible();
  });
  it('puts paused series in their own group', () => {
    render(<RecurringLedger {...props} series={[{ ...series, is_active: false }]} />);
    expect(screen.getByRole('heading', { name: 'groups.paused' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'groups.later' })).toBeNull();
  });
  it('supports arrow-key navigation for exclusive filters', () => {
    const select = vi.fn();
    render(
      <CompactSegments
        ariaLabel="Types"
        selected="all"
        onSelect={select}
        options={[
          { key: 'all', label: 'All' },
          { key: 'expense', label: 'Expenses' },
        ]}
      />
    );
    const all = screen.getByRole('radio', { name: 'All' });
    all.focus();
    fireEvent.keyDown(all, { key: 'ArrowRight' });
    expect(select).toHaveBeenCalledWith('expense');
    expect(screen.getByRole('radio', { name: 'Expenses' })).toHaveFocus();
  });
});
