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

it.each([
  ['Negozio A', '🛍 Hai speso 79,99 €\nSaldo di EUR: 1.642,84 €', '79.99', 'expense', 'Negozio A'],
  ['Locale A', '🍽️ Hai speso 7,50 €\nSaldo di EUR: 1.542,50 €', '7.50', 'expense', 'Locale A'],
  ['Locale A', '🍽️ Hai speso 2 €\nSaldo di EUR: 1.540,50 €', '2.00', 'expense', 'Locale A'],
  ['Negozio B', '🛒 Hai speso 4 €', '4.00', 'expense', 'Negozio B'],
  ['Servizio A', '🚌 Hai speso 5 €', '5.00', 'expense', 'Servizio A'],
  ['Servizio B', '⚒️ Hai speso 23 €', '23.00', 'expense', 'Servizio B'],
  [
    'Hai ricevuto 57 €',
    'Pagamento ricevuto da Persona di test. Premi per i dettagli',
    '57.00',
    'income',
    'Persona di test',
  ],
  [
    'Denaro inviato ✅',
    'Hai inviato 28 € a Persona di test. Arriverà in pochi secondi',
    '28.00',
    'expense',
    'Persona di test',
  ],
  [
    'Denaro inviato ✅',
    'Hai inviato 6 € a Persona di test. Arriverà in pochi secondi',
    '6.00',
    'expense',
    'Persona di test',
  ],
  [
    'Denaro inviato ✅',
    'Hai inviato 116 € a Persona di test. Arriverà in pochi secondi',
    '116.00',
    'expense',
    'Persona di test',
  ],
])(
  'recognizes confirmed EUR movements with NBSP and varied emoji: %s %s',
  (title, body, amount, type, description) => {
    expect(parseBankNotification({ ...notification, title, body }, now).parsed).toMatchObject({
      amount,
      type,
      description,
    });
  }
);
it.each([
  [
    'Sei nel 28% dei nostri clienti migliori',
    'Richiedi 2 mesi di Premium gratis entro una data. Si applicano i Termini e condizioni',
  ],
  [
    'Prova Metal gratis',
    "Vantaggi del valore di 4.100 € gratis. Fai l'upgrade. Si applicano i Termini e condizioni",
  ],
  [
    'Audi Revolut F1® Team: Brasile',
    'Scopri una carta in edizione limitata. Si applicano i Termini e condizioni',
  ],
  [
    'Salda i conti senza stress',
    'Dividi le spese di gruppo e fatti rimborsare. Si applicano i Termini e condizioni.',
  ],
])('filters promotional messages without interpreting amounts as payments: %s', (title, body) => {
  expect(parseBankNotification({ ...notification, title, body }, now)).toEqual({
    parsed: null,
    reason: 'non_transaction',
  });
});
it('keeps unknown messages and unconfirmed outgoing payments available for review', () => {
  expect(
    parseBankNotification(
      {
        ...notification,
        title: 'Denaro inviato',
        body: 'Hai inviato 28 € a Persona. Pagamento in sospeso',
      },
      now
    ).reason
  ).toBe('unconfirmed_movement');
  expect(
    parseBankNotification(
      { ...notification, title: 'Hai ricevuto 57 €', body: 'Una nuova offerta per te' },
      now
    ).parsed
  ).toBeNull();
});

it.each([
  '17',
  '79,99',
  '4',
  '7,50',
  '2',
  '19,90',
  '10,79',
  '5',
  '75',
  '23',
  '2,40',
  '16',
  '33,04',
])('preserves each supplied EUR expense amount: %s', (value) => {
  expect(
    parseBankNotification(
      { ...notification, title: 'Verified merchant', body: `🍽️ Hai speso ${value}\u00a0€` },
      now
    ).parsed?.amount
  ).toBe(Number(value.replace(',', '.')).toFixed(2));
});
