import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionRow } from './transaction-row';
import type { Transaction } from '@/lib';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === 'actions.editAria' && values) {
      return `Edit ${values.description}`;
    }
    return key;
  },
}));

const transaction: Transaction = {
  id: 'tx-1',
  user_id: 'u1',
  group_id: 'g1',
  amount: 12.5,
  category: 'food',
  date: '2024-06-01',
  type: 'expense',
  account_id: 'a1',
  description: 'Lunch',
  created_at: '2024-06-01',
  updated_at: '2024-06-01',
};

describe('TransactionRow', () => {
  it('renders a Home-style button with test id and meta', () => {
    const onEdit = vi.fn();
    render(
      <TransactionRow
        transaction={transaction}
        accountNames={{ a1: 'Checking' }}
        getCategoryLabel={(key) => (key === 'food' ? 'Food' : key)}
        onEditTransaction={onEdit}
      />
    );

    const row = screen.getByTestId('transaction-row-tx-1');
    expect(row.tagName).toBe('BUTTON');
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Food · Checking')).toBeInTheDocument();
    fireEvent.click(row);
    expect(onEdit).toHaveBeenCalledWith(transaction);
  });
});
