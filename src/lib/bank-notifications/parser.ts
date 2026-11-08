import { z } from 'zod';
import { financialDateKey } from '@/lib/utils/financial-date';

export const notificationSchema = z
  .object({
    provider: z.enum(['revolut', 'trade_republic', 'credem']).default('revolut'),
    title: z.string().trim().max(300).default(''),
    body: z.string().trim().min(1).max(4000),
    occurredAt: z.iso
      .datetime({ offset: true })
      .refine((value) => Number.isFinite(Date.parse(value)))
      .optional(),
    eventId: z.string().trim().min(1).max(200).optional(),
  })
  .strict();
export type BankNotification = z.infer<typeof notificationSchema>;
export type ParsedNotification = {
  description: string;
  amount: string;
  type: 'expense' | 'income';
  date: string;
  reportedBalance: string | null;
};
export type ParseResult = { parsed: ParsedNotification | null; reason: string | null };

export function normalizeMerchant(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('it');
}

function money(value: string): string | null {
  const compact = value.replace(/[\s\u00a0]/g, '');
  // Currency amounts are parsed by syntax, never with floating locale guesses.
  if (!/^-?(?:\d+|\d{1,3}(?:[.,]\d{3})+)(?:[.,]\d{1,2})?$/.test(compact)) return null;
  const decimal = /[.,]\d{1,2}$/.exec(compact);
  const whole = (decimal ? compact.slice(0, decimal.index) : compact).replace(/[.,]/g, '');
  const cents =
    Number(whole) * 100 +
    (compact.startsWith('-') ? -1 : 1) * Number((decimal?.[0].slice(1) ?? '').padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || Math.abs(cents) > 999999999999) return null;
  return (cents / 100).toFixed(2);
}

/** Each bank owns a parser; unknown formats stay in the review inbox. */
export function parseBankNotification(input: BankNotification, now = new Date()): ParseResult {
  if (input.provider !== 'revolut') return { parsed: null, reason: 'unsupported_provider' };
  const text = `${input.title}\n${input.body}`;
  if (
    !/(?:hai speso|hai ricevuto|hai inviato|you spent|you received|you sent)/i.test(text) &&
    /si applicano i termini e condizioni/i.test(input.body) &&
    /gratis|upgrade|carta in edizione limitata|dividi le spese di gruppo/i.test(input.body)
  )
    return { parsed: null, reason: 'non_transaction' };
  if (!input.occurredAt) return { parsed: null, reason: 'missing_date' };
  if (Date.parse(input.occurredAt) > now.getTime() + 5 * 60_000)
    return { parsed: null, reason: 'future_date' };
  if (
    /rifiutat|annullat|stornat|in sospeso|preautorizz|declined|reversed|pending|refund|rimborso/i.test(
      text
    )
  )
    return { parsed: null, reason: 'unconfirmed_movement' };
  const patterns = [
    {
      type: 'expense' as const,
      re: /^(?:Hai speso|You spent|Hai inviato|You sent)\s+([\d.,\s]+)\s*(€|EUR)(.*)$/i,
    },
    { type: 'income' as const, re: /^(?:Hai ricevuto|You received)\s+([\d.,\s]+)\s*(€|EUR)(.*)$/i },
  ];
  const incomeInTitle = /^(?:Hai ricevuto|You received)\s+/i.test(input.title);
  const lines = incomeInTitle ? [input.title] : input.body.split(/\r?\n/);
  const matches = lines.flatMap((line) =>
    patterns.flatMap((pattern) => {
      const match = pattern.re.exec(
        line
          .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+/gu, '')
          .trim()
      );
      return match ? [{ match, type: pattern.type }] : [];
    })
  );
  if (matches.length !== 1) return { parsed: null, reason: 'unknown_format' };
  const { match, type } = matches[0]!;
  const amount = money(match[1]!);
  if (!amount || Number(amount) <= 0) return { parsed: null, reason: 'invalid_amount' };
  const suffix = match[3]!.trim();
  if (suffix && !/^(?:presso|da|a|at|to|from)\s+\S/i.test(suffix))
    return { parsed: null, reason: 'unknown_format' };
  const receivedParty = incomeInTitle
    ? /^(?:Pagamento ricevuto da|Payment received from)\s+(.+?)(?:[.]\s*(?:Premi per i dettagli|Tap for details))?[.]?$/i.exec(
        input.body.trim()
      )?.[1]
    : undefined;
  if (incomeInTitle && !receivedParty) return { parsed: null, reason: 'unknown_format' };
  const description =
    receivedParty?.trim() ||
    suffix
      .replace(/^(?:presso|da|a|at|to|from)\s+/i, '')
      .replace(/[.]\s*(?:Arriverà in pochi secondi|It will arrive in a few seconds)[.]?$/i, '')
      .trim() ||
    input.title.trim();
  if (!description || /^revolut$/i.test(description))
    return { parsed: null, reason: 'missing_merchant' };
  const balanceMatch =
    /(?:saldo(?: disponibile| di EUR)?|balance)\s*:?\s*(-?[\d.,\s]+)\s*(?:€|EUR)/i.exec(input.body);
  return {
    parsed: {
      description,
      amount,
      type,
      date: financialDateKey(input.occurredAt),
      reportedBalance: balanceMatch ? money(balanceMatch[1]!) : null,
    },
    reason: null,
  };
}
