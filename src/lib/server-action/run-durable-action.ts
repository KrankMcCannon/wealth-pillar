import { getCurrentUser } from '@/lib/auth/cached-auth';
import type { ServiceResult } from '@/lib/types/service-result';
import { executeFinancialOperation } from '@/server/use-cases/shared/financial-operation';
import { actionErrorMessage } from './action-error';
import { recordDatabaseEvent } from '@/server/db/telemetry';

class RejectedAction extends Error {
  constructor(readonly result: ServiceResult<unknown>) {
    super('Action rejected');
  }
}

/** Rollout switch supports the previous application during expand/adopt. */
export async function runDurableAction<T>(
  kind: string,
  payload: unknown,
  operationId: string | undefined,
  execute: () => Promise<ServiceResult<T>>
): Promise<ServiceResult<T>> {
  if (process.env.DB_DURABLE_OPERATIONS === 'false') return execute();
  try {
    const actor = await getCurrentUser();
    if (!actor?.group_id)
      return { data: null, error: 'Non autenticato', errorCode: 'UNAUTHORIZED' };
    return await executeFinancialOperation({
      actor,
      kind,
      operationId,
      payload,
      execute: async () => {
        const result = await execute();
        if (result.error) throw new RejectedAction(result);
        return result;
      },
    });
  } catch (error) {
    if (error instanceof RejectedAction) return error.result as ServiceResult<T>;
    recordDatabaseEvent('mutation.unknown');
    return {
      data: null,
      error: actionErrorMessage(error, 'Operazione non completata'),
      errorCode: 'OUTCOME_UNKNOWN',
    };
  }
}
