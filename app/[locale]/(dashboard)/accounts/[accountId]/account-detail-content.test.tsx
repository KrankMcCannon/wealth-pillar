import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { Account, Transaction } from '@/lib/types';
import AccountDetailContent from './account-detail-content';
import { useReferenceDataStore } from '@/stores/reference-data-store';

const mocks = vi.hoisted(() => ({ openModal: vi.fn(), header: vi.fn(), seed: vi.fn() }));
vi.mock('next-intl', () => ({
  useLocale: () => 'it',
  useTranslations: () => (key: string) => key,
}));
vi.mock('@/components/layout', () => ({
  HomeDashboardMain: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock('@/hooks/use-page-header', () => ({
  usePageHeader: (config: unknown) => mocks.header(config),
}));
vi.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock('@/lib/navigation/url-state', () => ({
  useModalState: () => ({ openModal: mocks.openModal }),
}));
vi.mock('@/features/transactions/stores/transaction-edit-store', () => ({
  useTransactionEditStore: () => mocks.seed,
}));

const account = {
  id: 'a1',
  name: 'Current',
  balance: -20,
  type: 'cash',
  user_ids: ['u1'],
  group_id: 'g1',
} as Account;
const transaction = {
  id: 't1',
  description: 'Reserve transfer',
  amount: 10,
  type: 'transfer',
  date: '2026-11-01',
  account_id: 'a1',
  to_account_id: 'a2',
  category: '',
  user_id: 'u1',
} as Transaction;

beforeEach(() => {
  vi.clearAllMocks();
  useReferenceDataStore.getState().reset();
});

describe('AccountDetailContent', () => {
  it('keeps the person context in back and full-ledger navigation, with secondary edit', () => {
    render(
      <AccountDetailContent
        selectedUserId="u1"
        pageData={{ account, accounts: [account], categories: [], transactions: [] }}
      />
    );
    expect(mocks.header).toHaveBeenLastCalledWith({
      title: 'Current',
      showBack: true,
      backHref: '/accounts?user=u1',
    });
    const ledger = new URL(
      screen.getByRole('link', { name: 'viewAll' }).getAttribute('href')!,
      'https://local.test'
    );
    expect(ledger.pathname).toBe('/transactions');
    expect(ledger.searchParams.get('account')).toBe('a1');
    expect(ledger.searchParams.get('user')).toBe('u1');
    expect(ledger.searchParams.get('from')).toBe('/accounts/a1?user=u1');
    fireEvent.click(screen.getByRole('button', { name: 'editAccount' }));
    expect(mocks.openModal).toHaveBeenCalledWith('account', 'a1');
    expect(screen.getByText('emptyTransactions')).toBeInTheDocument();
  });

  it('uses the existing ledger row with the outgoing transfer sign and edit seed', () => {
    render(
      <AccountDetailContent
        selectedUserId={undefined}
        pageData={{ account, accounts: [account], categories: [], transactions: [transaction] }}
      />
    );
    const row = screen.getByTestId('transaction-row-t1');
    expect(row.textContent).toMatch(/[−-]10/);
    fireEvent.click(row);
    expect(mocks.seed).toHaveBeenCalledWith(transaction);
    expect(mocks.openModal).toHaveBeenCalledWith('transaction', 't1');
  });
});
