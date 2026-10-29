import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WealthHeader } from './wealth-header';
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
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
