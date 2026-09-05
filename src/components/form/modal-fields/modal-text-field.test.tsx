import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { ModalTextField } from './modal-text-field';

function TestForm() {
  const form = useForm({ defaultValues: { note: '' } });
  return (
    <form>
      <ModalTextField control={form.control} name="note" label="Note" placeholder="Type here" />
    </form>
  );
}

describe('ModalTextField', () => {
  it('renders label and accepts input', async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    expect(screen.getByText('Note')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Type here');
    await user.type(input, 'hello');
    expect(input).toHaveValue('hello');
  });

  it('keeps numeric inputs as decimal text in the leftover space beside the label', () => {
    function NumberForm() {
      const form = useForm({ defaultValues: { shares: '10' } });
      return (
        <form>
          <ModalTextField
            control={form.control}
            name="shares"
            label="Quote acquisite"
            type="number"
          />
        </form>
      );
    }

    render(<NumberForm />);
    const input = screen.getByLabelText('Quote acquisite');
    expect(input).toHaveAttribute('inputMode', 'decimal');
    expect(input).not.toHaveAttribute('type', 'number');
    expect(input).toHaveClass('w-0', 'flex-1', 'text-right');
    expect(screen.getByText('Quote acquisite')).toHaveClass('max-w-[70%]');
  });

  it('uses a full-width start-aligned input when layout is plain', () => {
    function PlainForm() {
      const form = useForm({ defaultValues: { email: '' } });
      return (
        <form>
          <ModalTextField
            control={form.control}
            name="email"
            layout="plain"
            label="Email"
            placeholder="Email"
          />
        </form>
      );
    }

    render(<PlainForm />);
    const input = screen.getByPlaceholderText('Email');
    expect(input).toHaveClass('text-left');
    expect(input).not.toHaveClass('text-right');
    expect(screen.getByText('Email')).toHaveClass('sr-only');
  });
});
