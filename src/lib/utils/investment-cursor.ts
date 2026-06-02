export const INVESTMENT_CURSOR_V1 = 1 as const;

export type InvestmentCursorPayloadV1 = {
  v: typeof INVESTMENT_CURSOR_V1;
  /** ISO-8601 timestamp for created_at */
  c: string;
  i: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toIsoTimestamp(value: string | Date): string {
  if (typeof value === 'string') return value;
  return value.toISOString();
}

export function encodeInvestmentCursor(row: {
  created_at: string | Date | null;
  id: string;
}): string {
  const payload: InvestmentCursorPayloadV1 = {
    v: INVESTMENT_CURSOR_V1,
    c: toIsoTimestamp(row.created_at ?? new Date()),
    i: row.id,
  };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeInvestmentCursor(token: string):
  | {
      createdAt: Date;
      id: string;
    }
  | undefined {
  try {
    const json = Buffer.from(token, 'base64url').toString('utf8');
    const parsed: unknown = JSON.parse(json);
    if (!isRecord(parsed)) return undefined;
    if (parsed.v !== INVESTMENT_CURSOR_V1) return undefined;
    if (typeof parsed.c !== 'string' || typeof parsed.i !== 'string') {
      return undefined;
    }
    const createdAt = new Date(parsed.c);
    if (Number.isNaN(createdAt.getTime())) return undefined;
    return { createdAt, id: parsed.i };
  } catch {
    return undefined;
  }
}
