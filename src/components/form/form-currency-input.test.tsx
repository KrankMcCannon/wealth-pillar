import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormCurrencyInput } from './form-currency-input';
import { useState } from 'react';

function BoundInput() {
  const [value, setValue] = useState('');
  return (
    <label>
      Amount
      <FormCurrencyInput
        id="amount"
        value={value}
        onChange={setValue}
        bare
        aria-invalid={false}
        aria-describedby="amount-error"
        autoComplete="off"
      />
    </label>
  );
}

describe('FormCurrencyInput', () => {
  it('keeps decimal text input and wires describedby', async () => {
    const user = userEvent.setup();
    render(<BoundInput />);
    const input = screen.getByLabelText('Amount');
    expect(input).toHaveAttribute('inputMode', 'decimal');
    expect(input).toHaveAttribute('aria-describedby', 'amount-error');
    await user.type(input, '12,5');
    expect(input).toHaveValue('12,5');
  });
});
