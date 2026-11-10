'use server';

import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/cached-auth';
import { readFinancialOperation } from '@/server/use-cases/shared/financial-operation';

export async function getFinancialOperationAction(kind: string, operationId: string) {
  const actor = await getCurrentUser();
  if (!actor) return { data: null, error: 'Non autenticato' };
  const input = z
    .object({ kind: z.string().min(1).max(100), operationId: z.uuid() })
    .parse({ kind, operationId });
  const data = await readFinancialOperation(actor, input.kind, input.operationId);
  return { data, error: null };
}
