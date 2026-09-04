import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import type { User } from '@/lib/types';
import { ModalMultiSelectField } from './modal-multi-select-field';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === 'currentUser') return '(You)';
    if (key === 'placeholder') return 'Select users';
    if (key === 'selectedCount' && values && 'count' in values) return `${values.count} selected`;
    return key;
  },
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/components/ui/modal-wrapper', () => ({
  ModalWrapper: ({
    isOpen,
    title,
    children,
    onOpenChange,
  }: {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    onOpenChange: (open: boolean) => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
        <button type="button" onClick={() => onOpenChange(false)}>
          close
        </button>
      </div>
    ) : null,
}));

const users = [
  { id: 'u1', name: 'Edoardo' },
  { id: 'u2', name: 'Ivana' },
] as User[];

function TestForm({
  shape = 'rows' as const,
}: {
  shape?: 'rows' | 'chips';
}) {
  const form = useForm({ defaultValues: { user_ids: ['u1'] } });
  return (
    <ModalMultiSelectField
      control={form.control}
      name="user_ids"
      label="Users"
      options={users.map((user) => ({ value: user.id, label: user.name ?? '' }))}
      shape={shape}
      users={users}
      currentUserId="u1"
    />
  );
}

describe('ModalMultiSelectField rows', () => {
  it('renders a selector row instead of an inline user card', () => {
    render(<TestForm />);

    expect(screen.getByRole('button', { name: /Users/i })).toBeInTheDocument();
    expect(screen.getByText('Edoardo (You)')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="field"]')).not.toBeInTheDocument();
  });

  it('opens a picker and toggles another user', async () => {
    const user = userEvent.setup();
    render(<TestForm />);

    await user.click(screen.getByRole('button', { name: /Users/i }));
    expect(screen.getByRole('dialog', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByText('Ivana')).toBeInTheDocument();

    await user.click(screen.getByText('Ivana'));
    expect(screen.getByText('Edoardo (You), Ivana')).toBeInTheDocument();
  });
});

const categoryOptions = [
  { value: 'food', label: 'Food', color: '#f00' },
  { value: 'rent', label: 'Rent', color: '#0f0' },
  { value: 'fuel', label: 'Fuel', color: '#00f' },
];

function CategoryForm() {
  const form = useForm({ defaultValues: { categories: ['food'] } });
  return (
    <ModalMultiSelectField
      control={form.control}
      name="categories"
      label="Categories"
      options={categoryOptions}
      shape="chips"
    />
  );
}

describe('ModalMultiSelectField chips', () => {
  it('renders a selector row instead of an inline chip card', () => {
    render(<CategoryForm />);

    expect(screen.getByRole('button', { name: /Categories/i })).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.queryByTestId('modal-multi-select-chips')).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="field"]')).not.toBeInTheDocument();
  });

  it('opens a picker and toggles another category', async () => {
    const user = userEvent.setup();
    render(<CategoryForm />);

    await user.click(screen.getByRole('button', { name: /Categories/i }));
    expect(screen.getByTestId('modal-multi-select-chips')).toHaveClass('flex-1', 'overflow-hidden');
    expect(screen.getByTestId('modal-multi-select-chips').firstElementChild).toHaveClass('px-4');
    expect(screen.getByTestId('modal-multi-select-chips').firstElementChild).not.toHaveClass(
      'sticky'
    );
    expect(screen.getByTestId('modal-multi-select-list')).toHaveClass('overflow-y-auto', 'flex-1');
    await user.click(screen.getByText('Rent'));
    expect(screen.getByText('Food, Rent')).toBeInTheDocument();
  });
});
