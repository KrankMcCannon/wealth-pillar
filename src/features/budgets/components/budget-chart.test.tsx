import { render, screen, fireEvent } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { BudgetChart } from './budget-chart';
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));
const data = [
  { date: '2026-10-01', amount: 10, x: 0, y: 0, isFuture: false },
  { date: '2026-10-11', amount: 25, x: 50, y: 0, isFuture: false },
  { date: '2026-10-12', amount: 99, x: 100, y: 0, isFuture: true },
];
it('exposes recorded data to keyboard and table readers without future values', () => {
  render(<BudgetChart spent={25} chartData={data} />);
  const slider = screen.getByRole('slider');
  expect(slider).toHaveAttribute('aria-valuetext', expect.stringContaining('€25.00'));
  fireEvent.change(slider, { target: { value: '0' } });
  expect(slider).toHaveAttribute('aria-valuetext', expect.stringContaining('€10.00'));
  expect(screen.getAllByRole('row', { hidden: true })).toHaveLength(3);
  expect(screen.queryByText('€99.00')).toBeNull();
});
it('offers a clear empty state with no misleading controls', () => {
  render(<BudgetChart spent={0} chartData={null} />);
  expect(screen.getByRole('status')).toHaveTextContent('emptyState');
  expect(screen.queryByRole('slider')).toBeNull();
});
