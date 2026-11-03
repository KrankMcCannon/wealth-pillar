import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useForm } from 'react-hook-form';
import { CurrencyProvider, useCurrency } from '@/providers/currency-provider';
import { ModalAmountField } from './modal-amount-field';
const snapshot = {
  currency: 'USD' as const,
  rates: {
    USD: { base: 'EUR', quote: 'USD', date: '2026-11-02', rate: 1.2 },
    GBP: { base: 'EUR', quote: 'GBP', date: '2026-11-02', rate: 0.8 },
  },
};
function EuroForm({
  onSave,
  variant,
}: {
  onSave: (data: { amount: string }) => void;
  variant: 'hero' | 'inline';
}) {
  const form = useForm({ defaultValues: { amount: '100.01' } });
  const currency = useCurrency();
  return (
    <form onSubmit={form.handleSubmit(onSave)}>
      <ModalAmountField
        control={form.control}
        name="amount"
        label="Amount"
        inputCurrency="EUR"
        variant={variant}
      />
      <button type="button" onClick={() => currency.setCurrency('GBP')}>
        GBP
      </button>
      <button type="submit">Save</button>
    </form>
  );
}
it.each(['hero', 'inline'] as const)(
  'keeps %s inputs and save payloads in EUR while converting only the counterpart',
  async (variant) => {
    const save = vi.fn();
    render(
      <CurrencyProvider snapshot={snapshot} locale="en-US">
        <EuroForm onSave={save} variant={variant} />
      </CurrencyProvider>
    );
    const input = screen.getByLabelText('Amount (EUR)');
    expect(input).toHaveValue('100.01');
    expect(screen.getByText('≈ $120.01')).toBeInTheDocument();
    fireEvent.blur(input);
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(save).toHaveBeenCalledWith({ amount: '100.01' }, expect.anything()));
    fireEvent.click(screen.getByText('GBP'));
    expect(input).toHaveValue('100.01');
    expect(screen.getByText('≈ £80.01')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '240' } });
    fireEvent.blur(input);
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() =>
      expect(save).toHaveBeenLastCalledWith({ amount: '240.00' }, expect.anything())
    );
    expect(screen.getByText('≈ £192.00')).toBeInTheDocument();
  }
);
