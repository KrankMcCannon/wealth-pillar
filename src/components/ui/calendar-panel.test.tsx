import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
});
