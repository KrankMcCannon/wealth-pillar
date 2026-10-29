import { createHmac, timingSafeEqual } from 'node:crypto';
import { assignImportHashes, computeImportHash } from '@/lib/import/import-hash';
import type { PrepareImportRowInput, PreparedImportRowInput } from '@/lib/import/types';

type ImportContext = { userId: string; groupId: string };
type ImportProofRow = Omit<PreparedImportRowInput, 'causale'>;
const PREVIEW_LIFETIME_MS = 24 * 60 * 60 * 1000;

function signingKey(): Buffer {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) throw new Error('Import signing is not configured');
  // Derive a separate, purpose-specific key from the existing server credential.
  return createHmac('sha256', secret).update('wealth-pillar:import-row-proof:v1').digest();
}

function signature(
  row: Omit<ImportProofRow, 'preparation_token'>,
  context: ImportContext,
  expiresAt: number
): Buffer {
  return createHmac('sha256', signingKey())
    .update(
      JSON.stringify([
        1,
        context.userId,
        context.groupId,
        row.rowId,
        row.account_id,
        row.date,
        row.description,
        row.amount,
        row.type,
        row.import_hash,
        row.occurrence_index,
        expiresAt,
      ])
    )
    .digest();
}

/** Assign identity over the complete uploaded file, before the user selects a subset. */
export async function prepareImportRowProofs(
  rows: PrepareImportRowInput[],
  context: ImportContext
): Promise<PreparedImportRowInput[]> {
  if (new Set(rows.map((row) => row.rowId)).size !== rows.length) {
    throw new Error('Duplicate import row IDs');
  }
  const byAccount = new Map<string, PrepareImportRowInput[]>();
  for (const row of rows) {
    const bucket = byAccount.get(row.account_id) ?? [];
    bucket.push(row);
    byAccount.set(row.account_id, bucket);
  }
  const result: PreparedImportRowInput[] = [];
  const expiresAt = Date.now() + PREVIEW_LIFETIME_MS;
  for (const [accountId, accountRows] of byAccount) {
    for (const row of await assignImportHashes(accountRows, accountId)) {
      result.push({
        ...row,
        preparation_token: `${expiresAt}.${signature(row, context, expiresAt).toString('base64url')}`,
      });
    }
  }
  return result;
}

/** Receipt binds immutable row fields, occurrence, uploader and group; category/user remain editable. */
export async function verifyImportRowProof(
  row: ImportProofRow,
  context: ImportContext
): Promise<void> {
  const [expires, proof, extra] = row.preparation_token.split('.');
  const expiresAt = Number(expires);
  if (extra !== undefined || !proof || !Number.isSafeInteger(expiresAt) || expiresAt < Date.now()) {
    throw new Error('Anteprima import non valida o scaduta. Prepara nuovamente il file.');
  }
  const expectedHash = await computeImportHash({
    accountId: row.account_id,
    date: row.date,
    type: row.type,
    amount: row.amount,
    description: row.description,
    occurrenceIndex: row.occurrence_index,
  });
  const expected = signature(row, context, expiresAt);
  const received = Buffer.from(proof, 'base64url');
  if (
    row.import_hash !== expectedHash ||
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    throw new Error('La riga importata è stata modificata. Prepara nuovamente il file.');
  }
}
