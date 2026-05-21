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
});
