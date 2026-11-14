import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReportsTimeFilter } from './reports-time-filter';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useFormatter: () => ({ dateTimeRange: () => 'custom range' }),
}));
vi.mock('@/hooks/use-mounted', () => ({ useMounted: () => true }));
vi.mock('@/components/ui/fields/date-field', () => ({
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
    <label>
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} />
      {error ? <span role="alert">{error}</span> : null}
    </label>
  ),
}));
vi.mock('@/components/ui/filters', () => ({
  FilterChip: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button onClick={onClick}>{label}</button>
  ),
  FilterChipRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FilterDrawer: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
}));

describe('ReportsTimeFilter custom range', () => {
  it('disables missing, malformed and inverted dates, then applies a corrected same-day range once', () => {
    const onCustomApply = vi.fn();
    render(
      <ReportsTimeFilter
        value="monthly"
        customRange={null}
        onChange={vi.fn()}
        onCustomApply={onCustomApply}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'custom' }));
    const apply = screen.getByRole('button', { name: 'apply' });
    const from = screen.getByLabelText('from');
    const to = screen.getByLabelText('to');
    expect(apply).toBeDisabled();
    fireEvent.change(from, { target: { value: '2026-10-12' } });
    expect(apply).toBeDisabled();
    fireEvent.change(to, { target: { value: '2026-10-10' } });
    expect(apply).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('invalidRange');
    fireEvent.click(apply);
    expect(onCustomApply).not.toHaveBeenCalled();
    fireEvent.change(to, { target: { value: '2026-02-30' } });
    expect(apply).toBeDisabled();
    fireEvent.change(to, { target: { value: '2026-10-12' } });
    expect(apply).toBeEnabled();
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(apply);
    expect(onCustomApply).toHaveBeenCalledExactlyOnceWith('2026-10-12', '2026-10-12');
  });
});
