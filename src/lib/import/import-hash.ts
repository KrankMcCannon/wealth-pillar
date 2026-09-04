import type { ImportRowType } from './types';

export function normalizeImportDescription(description: string): string {
  return description.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function buildImportHashPayload(parts: {
  accountId: string;
  date: string;
  type: ImportRowType;
  amount: number;
  description: string;
  occurrenceIndex: number;
}): string {
  const normalizedDescription = normalizeImportDescription(parts.description);
  const amountKey = parts.amount.toFixed(2);
  return [
    parts.accountId,
    parts.date,
    parts.type,
    amountKey,
    normalizedDescription,
    String(parts.occurrenceIndex),
  ].join('|');
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function computeImportHash(parts: {
  accountId: string;
  date: string;
  type: ImportRowType;
  amount: number;
  description: string;
  occurrenceIndex: number;
}): Promise<string> {
  return sha256Hex(buildImportHashPayload(parts));
}

export async function assignImportHashes<
  T extends { description: string; date: string; type: ImportRowType; amount: number },
>(rows: T[], accountId: string): Promise<Array<T & { import_hash: string }>> {
  const occurrenceByKey = new Map<string, number>();

  const withHashes: Array<T & { import_hash: string }> = [];
  for (const row of rows) {
    const key = buildImportHashPayload({
      accountId,
      date: row.date,
      type: row.type,
      amount: row.amount,
      description: row.description,
      occurrenceIndex: 0,
    }).replace('|0', '|');

    const nextIndex = occurrenceByKey.get(key) ?? 0;
    occurrenceByKey.set(key, nextIndex + 1);

    const importHash = await computeImportHash({
      accountId,
      date: row.date,
      type: row.type,
      amount: row.amount,
      description: row.description,
      occurrenceIndex: nextIndex,
    });

    withHashes.push({ ...row, import_hash: importHash });
  }

  return withHashes;
}
