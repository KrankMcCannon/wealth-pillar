import { describe, expect, it } from 'vitest';
import { notificationSchema, parseBankNotification } from './parser';
const now = new Date('2026-11-01T20:00:00Z');
const notification = {
  provider: 'revolut' as const,
  title: 'Pizzeria Rosticceria N',
  body: '🍽️ Hai speso 17 €\nSaldo di EUR: 1.722,83 €',
  occurredAt: '2026-11-01T19:30:00+01:00',
};
describe('Revolut notification contract', () => {
  it('parses the verified Italian format and keeps the reported balance separate', () => {
    expect(parseBankNotification(notification, now)).toEqual({
      parsed: {
        description: 'Pizzeria Rosticceria N',
        amount: '17.00',
        type: 'expense',
        date: '2026-11-01',
        reportedBalance: '1722.83',
      },
      reason: null,
    });
  });
  it.each([
    ['Hai speso 1.234,56 EUR', '1234.56', 'expense'],
    ['You received 1,234.56 EUR from Work', '1234.56', 'income'],
    ['Hai ricevuto 0,10 € da Anna', '0.10', 'income'],
  ])('parses %s', (body, amount, type) => {
    expect(parseBankNotification({ ...notification, body }, now).parsed).toMatchObject({
      amount,
      type,
    });
  });
  it('uses the Rome calendar day across UTC midnight', () => {
    expect(
      parseBankNotification({ ...notification, occurredAt: '2026-10-31T23:30:00Z' }, now).parsed
        ?.date
    ).toBe('2026-11-01');
  });
  it.each([
    'Pagamento rifiutato: Hai speso 17 €',
    'Hai speso 17 USD',
    'Hai speso -17 €',
    'Hai speso 0 €',
    'Hai speso 12,3456 €',
    'Hai speso 12 €\nHai speso 15 €',
    'Rimborso di 17 €',
    'Codice di sicurezza: 123456',
    'Hai speso 10 EUR per un pagamento in sospeso',
  ])('retains ambiguous messages for review: %s', (body) => {
    expect(parseBankNotification({ ...notification, body }, now).parsed).toBeNull();
  });
  it('does not invent a timestamp or guess another bank', () => {
    const { occurredAt: _, ...withoutDate } = notification;
    expect(parseBankNotification(withoutDate, now).reason).toBe('missing_date');
    expect(parseBankNotification({ ...notification, provider: 'credem' }, now).reason).toBe(
      'unsupported_provider'
    );
  });
  it('rejects dates without an offset and client-controlled account/user fields', () => {
    expect(
      notificationSchema.safeParse({ ...notification, occurredAt: '2026-11-01T19:30:00' }).success
    ).toBe(false);
    expect(notificationSchema.safeParse({ ...notification, user_id: 'other-user' }).success).toBe(
      false
    );
  });
});
