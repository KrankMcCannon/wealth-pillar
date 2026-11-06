import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarPanel } from './calendar-panel';

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string, values?: Record<string, string>) => {
    if (namespace === 'Forms.DateDrawer.dayCell' && key === 'selectDate') {
      return `Select ${values?.date ?? ''}`;
    }
    if (namespace === 'Forms.DateDrawer' && key.startsWith('monthHeader.')) {
      return key.replace('monthHeader.', '');
    }
    return key;
  },
  useLocale: () => 'en',
}));

describe('CalendarPanel', () => {
  it('starts empty fields in the current month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 30, 12));
    render(<CalendarPanel value="" onChange={() => {}} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /Select October 15, 2026/i })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('starts an empty end date in the requested start month', () => {
    render(
      <CalendarPanel value="" defaultMonth="2025-04-05" onChange={() => {}} onClose={() => {}} />
    );
    expect(screen.getByRole('button', { name: /Select April 15, 2025/i })).toBeInTheDocument();
  });

  it('does not render day-selection shortcuts', () => {
    render(<CalendarPanel value="2026-06-10" onChange={() => {}} onClose={() => {}} />);

    expect(screen.queryByText('Shortcuts')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /shortcuts/i })).not.toBeInTheDocument();
  });

  it('calls onChange with yyyy-MM-dd and onClose when a day is selected', () => {
    const onChange = vi.fn();
    const onClose = vi.fn();

    render(<CalendarPanel value="2026-06-10" onChange={onChange} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /Select June 15, 2026/i }));

    expect(onChange).toHaveBeenCalledWith('2026-06-15');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps keyboard focus on navigation across the year boundary', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CalendarPanel value="2026-12-31" onChange={onChange} onClose={() => {}} />);
    const next = screen.getByRole('button', { name: 'nextMonth' });
    next.focus();
    await user.keyboard('{Enter}');
    expect(next).toHaveFocus();
    expect(screen.getByRole('button', { name: /Select January 15, 2027/i })).toBeInTheDocument();
    const previous = screen.getByRole('button', { name: 'previousMonth' });
    await user.click(previous);
    expect(previous).toHaveFocus();
    expect(screen.getByRole('button', { name: /Select December 15, 2026/i })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each([
    ['2026-03-29', /Select March 29, 2026/i, '{Enter}'],
    ['2026-10-25', /Select October 25, 2026/i, ' '],
    ['2024-02-29', /Select February 29, 2024/i, '{Enter}'],
  ])(
    'selects the calendar day %s from the keyboard without shifting its date',
    async (value, label, key) => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onClose = vi.fn();
      render(<CalendarPanel value={value} onChange={onChange} onClose={onClose} />);
      screen.getByRole('button', { name: label }).focus();
      await user.keyboard(key);
      expect(onChange).toHaveBeenCalledExactlyOnceWith(value);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  );
});
