import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { ModalCheckboxField } from './modal-checkbox-field';

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

function TestForm() {
  const form = useForm({ defaultValues: { isDefault: false } });
  return (
    <ModalCheckboxField control={form.control} name="isDefault" label="Default" />
  );
}

describe('ModalCheckboxField', () => {
  it('renders a label/value row without a nested card', async () => {
    const user = userEvent.setup();
    render(<TestForm />);

    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="field"]')).not.toBeInTheDocument();
    expect(document.querySelector('.bg-modal-elevated')).not.toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
