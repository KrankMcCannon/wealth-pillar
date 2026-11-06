import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompleteNotificationModal } from './complete-notification-modal';
import { reviewBankNotificationAction, type getBankEventsAction } from './actions';
import type { User } from '@/lib/types';
const { acceptBalances } = vi.hoisted(() => ({ acceptBalances: vi.fn() }));
vi.mock('./actions', () => ({ reviewBankNotificationAction: vi.fn() }));
vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/settings',
  routing: { locales: ['it', 'en'], defaultLocale: 'it' },
  Link: 'a',
}));
vi.mock('next-intl', () => {
  const t = Object.assign((key: string) => key, { has: () => true });
  return { useTranslations: () => t, useLocale: () => 'en' };
});
vi.mock('@/providers/currency-provider', () => ({
  useCurrency: () => ({
    currency: 'USD',
    format: (amount: number) => `$${amount * 2}`,
    symbol: '$',
  }),
}));
vi.mock('@/stores/reference-data-store', () => ({
  useAccounts: () => [{ id: 'account', name: 'Revolut', user_ids: ['owner'] }],
  useCategories: () => [{ id: 'food', key: 'food', label: 'Food' }],
  useReferenceDataStore: { getState: () => ({ finishBalanceMutation: acceptBalances }) },
}));
const user = { id: 'owner', group_id: 'group' } as User;
const event = {
  id: 'event',
  account_id: 'account',
  category: 'food',
  parsed: null,
  payload: {
    title: 'Original merchant',
    body: 'Unknown format',
    occurredAt: '2026-10-24T22:30:00Z',
  },
} as NonNullable<Awaited<ReturnType<typeof getBankEventsAction>>['data']>['events'][number];
beforeEach(() => vi.resetAllMocks());

it('uses the existing transaction fields, locks the account and submits accounting EUR under a USD preference', async () => {
  const click = userEvent.setup();
  const onClose = vi.fn();
  const onComplete = vi.fn(async () => {});
  vi.mocked(reviewBankNotificationAction).mockResolvedValue({
    data: { accountBalances: { account: 87.66 }, accountBalanceVersions: { account: '2' } },
    error: null,
  });
  render(
    <CompleteNotificationModal
      event={event}
      user={user}
      onClose={onClose}
      onComplete={onComplete}
    />
  );
  expect(screen.queryByRole('radio', { name: 'typeOptions.transfer' })).not.toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'typeOptions.expense' })).not.toBeChecked();
  expect(screen.getByRole('combobox', { name: 'fields.sourceAccount.label' })).toBeDisabled();
  await click.type(screen.getByLabelText('fields.amount.label (EUR)'), '12,34');
  await click.click(screen.getByRole('radio', { name: 'typeOptions.expense' }));
  await click.click(screen.getByRole('button', { name: 'import' }));
  await waitFor(() =>
    expect(reviewBankNotificationAction).toHaveBeenCalledExactlyOnceWith({
      id: 'event',
      decision: 'import',
      category: 'food',
      manual: {
        description: 'Original merchant',
        amount: 12.34,
        type: 'expense',
        date: '2026-10-25',
      },
    })
  );
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(acceptBalances).toHaveBeenCalledWith('notification:event', {
    accountBalances: { account: 87.66 },
    accountBalanceVersions: { account: '2' },
  });
});

it('preserves the manual form and its EUR amount when the server rejects a confirmation', async () => {
  const click = userEvent.setup();
  const onClose = vi.fn();
  vi.mocked(reviewBankNotificationAction).mockResolvedValue({ data: null, error: 'unavailable' });
  render(
    <CompleteNotificationModal
      event={event}
      user={user}
      onClose={onClose}
      onComplete={async () => {}}
    />
  );
  await click.type(screen.getByLabelText('fields.amount.label (EUR)'), '17');
  await click.click(screen.getByRole('radio', { name: 'typeOptions.income' }));
  await click.click(screen.getByRole('button', { name: 'import' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('errors.unavailable');
  expect(onClose).not.toHaveBeenCalled();
  expect(acceptBalances).not.toHaveBeenCalled();
  expect(screen.getByLabelText('fields.amount.label (EUR)')).toHaveValue('17.00');
});
