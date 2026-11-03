import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WealthHeader } from './wealth-header';
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: { date: string }) =>
    values ? `${key}: ${values.date}` : key,
  useLocale: () => 'en-US',
}));
describe('portfolio valuation', () => {
  it('does not show a zero valuation or a loss when quotes are missing', () => {
    render(
      <WealthHeader
        totalValue={null}
        trendAmount={null}
        trendPercentage={null}
        marketDataUpdatedAt={null}
      />
    );
    expect(screen.getAllByText('valuationUnavailable')).toHaveLength(2);
    expect(screen.queryByText(/0[.,]00/)).toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();
  });
});

it('shows the actual quote day without inventing a retrieval time', () => {
  render(<WealthHeader totalValue={100} marketDataUpdatedAt="2026-11-02T00:00:00.000Z" />);
  expect(screen.getByText('marketDataFreshness: Nov 2, 2026')).toBeInTheDocument();
});
