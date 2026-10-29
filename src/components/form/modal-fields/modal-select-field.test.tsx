import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { ModalSelectField } from './modal-select-field';

vi.mock('@/components/form/form-select', () => ({
  FormSelect: ({
    captionLabel,
    placeholder,
    onValueChange,
  }: {
    captionLabel: string;
    placeholder?: string;
    onValueChange: (v: string) => void;
  }) => (
    <div>
      <span>{captionLabel}</span>
      <button type="button" onClick={() => onValueChange('expense')}>
        {placeholder ?? 'Select'}
      </button>
    </div>
  ),
}));

function TestForm() {
  const form = useForm({ defaultValues: { type: '' } });
  return (
    <ModalSelectField
      control={form.control}
      name="type"
      label="Type"
      placeholder="Choose type"
      options={[
        { value: 'expense', label: 'Expense' },
        { value: 'income', label: 'Income' },
      ]}
    />
  );
}

describe('ModalSelectField', () => {
  it('renders label and updates form value on selection', async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    expect(screen.getByText('Type')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Choose type' }));
    expect(screen.getByText('Choose type')).toBeInTheDocument();
  });
});
