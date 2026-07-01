import { describe, expect, it } from 'vitest';
import { parseRevolutRows } from './revolut.parser';
import { revolutFixtureRows } from './__fixtures__/revolut-sample.rows';

describe('parseRevolutRows', () => {
  it('groups by product and applies state and fee rules', () => {
    const groups = parseRevolutRows(revolutFixtureRows);
    const byKey = Object.fromEntries(groups.map((group) => [group.productKey, group]));

    expect(byKey.Attuale?.rows).toHaveLength(3);
    expect(byKey.Attuale?.excludedCount).toBe(2);
    expect(byKey.Risparmi?.rows).toHaveLength(1);

    const topup = byKey.Attuale?.rows.find((row) => row.description.includes('EDOARDO'));
    expect(topup).toMatchObject({ type: 'income', amount: 4500.8, date: '2025-01-09' });

    const paymentWithFee = byKey.Attuale?.rows.find((row) =>
      row.description.includes('Giuseppina')
    );
    expect(paymentWithFee).toMatchObject({ type: 'expense', amount: 64.45 });

    const pocket = byKey.Risparmi?.rows[0];
    expect(pocket).toMatchObject({
      type: 'income',
      amount: 6000,
      rawSource: { bank: 'revolut', product: 'Risparmi' },
    });
  });

  it('excludes zero-amount completed rows', () => {
    const groups = parseRevolutRows([
      ...revolutFixtureRows.slice(0, 1),
      [
        'Pagamento',
        'Risparmi',
        '2025-07-08 14:50:45',
        '2025-07-08 14:50:45',
        'Closing transaction',
        '0.00',
        '0.00',
        'EUR',
        'COMPLETATO',
        '0.00',
      ],
    ]);

    const risparmi = groups.find((group) => group.productKey === 'Risparmi');
    expect(risparmi?.rows).toHaveLength(0);
    expect(risparmi?.excludedCount).toBe(1);
  });
});
