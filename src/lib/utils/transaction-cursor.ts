export const TRANSACTION_CURSOR_V1 = 1 as const;

export type TransactionCursorPayloadV1 = {
  v: typeof TRANSACTION_CURSOR_V1;
  /** ISO date YYYY-MM-DD (transaction business date) */
  d: string;
  /** ISO-8601 timestamp for created_at */
  c: string;
  i: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toDateOnly(value: string | Date): string {
  if (typeof value === 'string') return value.split('T')[0] ?? value;
  return value.toISOString().split('T')[0] ?? '';
}

function toIsoTimestamp(value: string | Date): string {
  if (typeof value === 'string') return value;
  return value.toISOString();
}

export function encodeTransactionCursor(row: {
  date: string | Date;
  created_at: string | Date;
  id: string;
}): string {
  const payload: TransactionCursorPayloadV1 = {
    v: TRANSACTION_CURSOR_V1,
    d: toDateOnly(row.date),
    c: toIsoTimestamp(row.created_at),
    i: row.id,
  };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeTransactionCursor(token: string):
  | {
      date: string;
      createdAt: Date;
      id: string;
    }
  | undefined {
  try {
    const json = Buffer.from(token, 'base64url').toString('utf8');
    const parsed: unknown = JSON.parse(json);
    if (!isRecord(parsed)) return undefined;
    if (parsed.v !== TRANSACTION_CURSOR_V1) return undefined;
    if (
      typeof parsed.d !== 'string' ||
      typeof parsed.c !== 'string' ||
      typeof parsed.i !== 'string'
    ) {
      return undefined;
    }
    const createdAt = new Date(parsed.c);
    if (Number.isNaN(createdAt.getTime())) return undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.d)) return undefined;
    return { date: parsed.d, createdAt, id: parsed.i };
  } catch {
    return undefined;
  }
}
