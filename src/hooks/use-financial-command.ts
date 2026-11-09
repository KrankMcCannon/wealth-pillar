'use client';

import { useCallback } from 'react';
import { useCurrentUser } from '@/providers/user-provider';
import { runPendingFinancialOperation } from '@/lib/utils/pending-financial-operations';
import type { ServiceResult } from '@/lib/types/service-result';

export function useFinancialCommand() {
  const actor = useCurrentUser();
  const scope = actor?.group_id ? `${actor.group_id}:${actor.id}` : null;
  return useCallback(
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
}
