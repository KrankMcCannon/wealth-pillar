import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { ModalAmountField } from './modal-amount-field';

vi.mock('@/components/form/form-currency-input', () => ({
  FormCurrencyInput: ({
    value,
    onChange,
    placeholder,
    className,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
  }) => (
    <input
      className={className}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

function HeroAmountForm() {
  const form = useForm({ defaultValues: { amount: '' } });
  return (
    <form>
      <ModalAmountField control={form.control} name="amount" label="Amount" currency="€" />
    </form>
  );
}

function InlineAmountForm() {
  const form = useForm({ defaultValues: { amount: '' } });
  return (
    <form>
      <ModalAmountField
        control={form.control}
        name="amount"
        label="Limit"
        variant="inline"
        placeholder="0,00"
      />
    </form>
  );
}

describe('ModalAmountField', () => {
  it('renders hero variant with currency and label', () => {
    render(<HeroAmountForm />);
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('€')).toBeInTheDocument();
  });

  it('accepts amount input in inline variant', async () => {
    const user = userEvent.setup();
    render(<InlineAmountForm />);
    const input = screen.getByPlaceholderText('0,00');
    await user.type(input, '42');
    expect(input).toHaveValue('42');
  });
});
