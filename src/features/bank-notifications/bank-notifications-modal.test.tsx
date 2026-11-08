import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BankNotificationsModal } from './bank-notifications-modal';
import { BankNotificationsSection } from './bank-notifications-section';
import { createBankConnectionAction, getBankSettingsAction } from './actions';
import type { User } from '@/lib/types';

vi.mock('next-intl', () => ({
  useTranslations: () => Object.assign((key: string) => key, { has: () => true }),
}));
vi.mock('./actions', () => ({
  createBankConnectionAction: vi.fn(),
  getBankSettingsAction: vi.fn(),
  revokeBankConnectionAction: vi.fn(),
}));
vi.mock('@/features/categories/actions/category-actions', () => ({
  getAllCategoriesAction: async () => ({ data: [] }),
}));
vi.mock('@/stores/reference-data-store', () => ({
  useAccounts: () => [],
  useReferenceDataStore: { getState: () => ({ refreshCategories: vi.fn() }) },
}));
vi.mock('./notification-inbox', () => ({ NotificationInbox: () => <div>inbox</div> }));
vi.mock('@/components/form/form-select', () => ({
  FormSelect: ({
    captionLabel,
    value,
    onValueChange,
    options,
  }: {
    captionLabel: string;
    value: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <select
      aria-label={captionLabel}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      <option value="" />
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));
const user = { id: 'owner', group_id: 'household' } as User;
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getBankSettingsAction).mockResolvedValue({
    data: { accounts: [{ id: 'account', name: 'Revolut' }], categories: [], connections: [] },
    error: null,
  });
  vi.mocked(createBankConnectionAction).mockResolvedValue({
    data: { id: 'device', token: 'test-only-token' },
    error: null,
  });
});
it('uses a standard settings row which opens the panel', () => {
  const onOpen = vi.fn();
  render(<BankNotificationsSection onOpen={onOpen} />);
  fireEvent.click(screen.getByRole('button', { name: 'title, Revolut' }));
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(screen.queryByLabelText('device')).not.toBeInTheDocument();
});
it('creates a connection without choosing a category', async () => {
  render(<BankNotificationsModal user={user} onClose={vi.fn()} />);
  await waitFor(() => expect(screen.getByRole('option', { name: 'Revolut' })).toBeInTheDocument());
  expect(screen.queryByRole('combobox', { name: 'category' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('device'), { target: { value: 'iPhone' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'account' }), {
    target: { value: 'account' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'connect' }));
  await waitFor(() =>
    expect(createBankConnectionAction).toHaveBeenCalledExactlyOnceWith({
      name: 'iPhone',
      accountId: 'account',
      autoImport: false,
    })
  );
  expect(await screen.findByText('secretOnce')).toBeInTheDocument();
});
