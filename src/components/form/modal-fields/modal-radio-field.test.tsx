import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { ModalRadioField } from './modal-radio-field';

function TypeForm({ disabled = false }: { disabled?: boolean }) {
  const form = useForm({ defaultValues: { type: 'expense' } });
  return (
    <form>
      <ModalRadioField
        control={form.control}
        name="type"
        label="Type"
        disabled={disabled}
        options={[
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
          { value: 'transfer', label: 'Transfer', description: 'Move between accounts' },
        ]}
      />
    </form>
  );
}

describe('ModalRadioField', () => {
  it('renders a labelled radiogroup and changes value', async () => {
    const user = userEvent.setup();
    render(<TypeForm />);
    expect(screen.getByRole('radiogroup', { name: 'Type' })).toBeInTheDocument();
    const income = screen.getByRole('radio', { name: /Income/ });
    await user.click(income);
    expect(income).toBeChecked();
  });

  it('moves selection with arrow keys', async () => {
    const user = userEvent.setup();
    render(<TypeForm />);
    screen.getByRole('radio', { name: /Expense/ }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: /Income/ })).toBeChecked();
  });

  it('renders helper text on cards', () => {
    function CardForm() {
      const form = useForm({ defaultValues: { type: 'payroll' } });
      return (
        <ModalRadioField
          control={form.control}
          name="type"
          label="Account type"
          variant="cards"
          options={[{ value: 'payroll', label: 'Checking', description: 'Salary lands here' }]}
        />
      );
    }
    render(<CardForm />);
    const title = screen.getByText('Checking');
    const description = screen.getByText('Salary lands here');
    expect(title).not.toHaveTextContent('Salary');
    expect(title.nextElementSibling).toBe(description);
  });
});
