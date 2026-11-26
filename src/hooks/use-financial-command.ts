'use client';

import { useCallback, useMemo } from 'react';
import { useCurrentUser } from '@/providers/user-provider';
import {
  runPendingFinancialOperation,
  verifyPendingFinancialOperation,
  type PendingOperationVerification,
} from '@/lib/utils/pending-financial-operations';
import type { ServiceResult } from '@/lib/types/service-result';

type FinancialCommand = {
  <const Args extends readonly unknown[], T>(
    kind: string,
    payload: Args,
    execute: (operationId: string | undefined, args: Args) => Promise<ServiceResult<T>>
  ): Promise<ServiceResult<T>>;
  verify<T>(kind: string, payload: readonly unknown[]): Promise<PendingOperationVerification<T>>;
};

export function useFinancialCommand() {
  const actor = useCurrentUser();
  const scope = actor?.group_id ? `${actor.group_id}:${actor.id}` : null;
  const execute = useCallback(
    <const Args extends readonly unknown[], T>(
      kind: string,
      payload: Args,
      execute: (operationId: string | undefined, args: Args) => Promise<ServiceResult<T>>
    ) =>
      scope
        ? runPendingFinancialOperation(scope, kind, payload, (operationId) =>
            execute(operationId, payload)
          )
        : execute(undefined, payload),
    [scope]
  );
  return useMemo(() => {
    const command: FinancialCommand = Object.assign(execute, {
      verify: <T>(kind: string, payload: readonly unknown[]) =>
        scope
          ? verifyPendingFinancialOperation<T>(scope, kind, payload)
          : Promise.resolve({ status: 'not_registered' as const }),
    });
    return command;
  }, [execute, scope]);
}
