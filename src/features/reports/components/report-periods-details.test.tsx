import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ReportPeriodsDetails } from './report-periods-details';
import { loadReportPeriodsAction } from '../actions/report-periods-actions';

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('../actions/report-periods-actions', () => ({ loadReportPeriodsAction: vi.fn() }));
vi.mock('./budget-period-section', () => ({
  BudgetPeriodSection: ({ periods }: { periods: { userId: string }[] }) => (
    <div>{periods.map((p) => p.userId).join(',')}</div>
  ),
}));

const props = {
  window: { start: '2026-10-01', end: '2026-10-30' },
  scope: 'all',
  users: [],
  viewerId: 'u1',
  hrefForPeriod: () => '/reports',
};
describe('report period details recovery', () => {
  beforeEach(() => vi.resetAllMocks());
  it('shows a retryable error without turning a failed load into an empty period list', async () => {
    vi.mocked(loadReportPeriodsAction)
      .mockResolvedValueOnce({ data: null, error: 'UNAVAILABLE' })
      .mockResolvedValueOnce({ data: [{ userId: 'u1' }] as never, error: null });
    render(<ReportPeriodsDetails {...props} />);
    expect(screen.getByRole('status')).toHaveTextContent('detailsLoading');
    expect(await screen.findByRole('alert')).toHaveTextContent('detailsError');
    fireEvent.click(screen.getByRole('button', { name: 'retry' }));
    expect(await screen.findByText('u1')).toBeInTheDocument();
    expect(loadReportPeriodsAction).toHaveBeenCalledTimes(2);
  });
  it('filters a loaded admin dataset when the visible member changes, without fetching again', async () => {
    vi.mocked(loadReportPeriodsAction).mockResolvedValue({
      data: [{ userId: 'u1' }, { userId: 'u2' }] as never,
      error: null,
    });
    const view = render(<ReportPeriodsDetails {...props} />);
    expect(await screen.findByText('u1,u2')).toBeInTheDocument();
    view.rerender(<ReportPeriodsDetails {...props} scope="u2" />);
    expect(screen.getByText('u2')).toBeInTheDocument();
    expect(loadReportPeriodsAction).toHaveBeenCalledTimes(1);
  });
});
