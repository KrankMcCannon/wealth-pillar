import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReserveSection } from './reserve-section';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === 'savingsMeta' && values) {
      return `${values.deposits} · ${values.withdrawals}`;
    }
    if (key === 'viewMoves' && values) return `viewMoves ${values.count}`;
    if (key === 'viewMovesAria' && values) return `viewMovesAria ${values.count}`;
    return key;
  },
}));

vi.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/features/reports/hooks/use-format-currency', () => ({
  useFormatCurrency: () => ({ format: (n: number) => `€${n}` }),
}));

describe('ReserveSection', () => {
  it('shows net for the window and a link to movements, not the list', () => {
    render(
      <ReserveSection
        movementsHref="/transactions?type=transfer"
        savings={{ deposits: 100, withdrawals: 40, net: 60, count: 2 }}
      />
    );

    expect(screen.getByRole('heading', { name: 'title' })).toBeTruthy();
    expect(screen.getByLabelText('+€60')).toBeTruthy();
    expect(screen.getByText('€100 · €40')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'viewMovesAria 2' })).toHaveAttribute(
      'href',
      '/transactions?type=transfer'
    );
    expect(screen.queryByText('To savings')).toBeNull();
    expect(screen.queryByText('empty')).toBeNull();
  });

  it('shows empty copy and a transfer link when nothing moved', () => {
    render(
      <ReserveSection
        movementsHref="/transactions?type=transfer"
        savings={{ deposits: 0, withdrawals: 0, net: 0, count: 0 }}
      />
    );

    expect(screen.getByText('empty')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'addTransfer' })).toHaveAttribute(
      'href',
      '/transactions'
    );
  });
});
