import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DateOptions } from './filter-drawer-panels';
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@/components/ui', () => ({
  DateField: ({
    label,
    value,
    onChange,
    error,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
  }) => (
    <>
      <input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} />
      {error ? <p role="alert">{error}</p> : null}
    </>
  ),
}));
it('rejects reversed ranges and allows clearing both dates', () => {
  const change = vi.fn();
  render(
    <DateOptions
      selectedDateRange="custom"
      initialStartDate="2026-10-01"
      initialEndDate="2026-10-31"
      onSelect={vi.fn()}
      onClose={vi.fn()}
      onDateRangeChange={change}
      presets={[]}
    />
  );
  fireEvent.change(screen.getByLabelText('customRange.toLabel'), {
    target: { value: '2026-09-30' },
  });
  expect(screen.getByRole('alert')).toHaveTextContent('customRange.invalidOrder');
  expect(change).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('customRange.toLabel'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('customRange.fromLabel'), { target: { value: '' } });
  expect(change).toHaveBeenLastCalledWith('', '');
});
