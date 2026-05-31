import { describe, it, expect } from 'vitest';
import {
  buildInvestmentPayload,
  mapInvestmentToFormData,
} from '@/features/investments/utils/investment-form-data';

describe('investment-form-data', () => {
  it('maps investment rows to form values', () => {
    const mapped = mapInvestmentToFormData({
      id: 'inv-1',
      name: 'Apple',
      symbol: 'AAPL',
      amount: '1000',
      tax_paid: '12',
      shares_acquired: '4',
      currency: 'USD',
      created_at: new Date('2026-01-15T10:00:00.000Z'),
      updated_at: new Date('2026-01-15T10:00:00.000Z'),
      user_id: 'u1',
      currency_rate: '1',
      net_earn: '0',
    });

    expect(mapped).toEqual({
      name: 'Apple',
      symbol: 'AAPL',
      amount: '1000',
      tax_paid: '12',
      shares: '4',
      currency: 'USD',
      created_at: '2026-01-15',
    });
  });

  it('builds create/update payload from form values', () => {
    const payload = buildInvestmentPayload({
      name: 'Apple',
      symbol: 'aapl',
      amount: '1000',
      tax_paid: '12',
      shares: '4',
      currency: 'EUR',
      created_at: '2026-01-15',
    });

    expect(payload.symbol).toBe('AAPL');
    expect(payload.amount).toBe(1000);
    expect(payload.shares_acquired).toBe(4);
    expect(payload.created_at).toEqual(new Date('2026-01-15'));
  });
});
