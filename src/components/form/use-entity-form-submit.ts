'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { withDeadline, ActionTimeoutError, isTechnicalError } from '@/lib/utils/with-deadline';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';

// Retain in-flight ownership across closing/reopening a modal in this tab.
const pendingSubmissions = new Set<string>();

export type EntityFormActionResult<R> = { data: R | null; error: string | null };

export interface EntityFormSubmitToastMessages {
  success: { title: string; description: string };
  error: { title: string; description?: string };
}

export interface UseEntityFormSubmitOptions<T extends FieldValues, Payload, Result, Handle = void> {
  isEditMode: boolean;
  submissionKey?: string;
  editId?: string | null | undefined;
  onClose: () => void;
  buildPayload: (values: T) => Payload;
  createAction: (payload: Payload) => Promise<EntityFormActionResult<Result>>;
  updateAction: (id: string, payload: Payload) => Promise<EntityFormActionResult<Result>>;
  applyCreateOptimistic?: (payload: Payload) => Handle;
  commitCreate?: (handle: Handle, result: Result) => void;
  rollbackCreate?: (handle: Handle, error: string) => void;
  applyUpdateOptimistic?: (id: string, payload: Payload) => Handle;
  commitUpdate?: (handle: Handle, result: Result) => void;
  rollbackUpdate?: (handle: Handle, error: string) => void;
  getSuccessToast: (isEditMode: boolean) => EntityFormSubmitToastMessages['success'];
  errorToast: EntityFormSubmitToastMessages['error'];
  formatErrorDescription?: (error: string, isEditMode: boolean) => string | undefined;
  refreshAfterSuccess?: () => void;
  refreshAfterUncertain?: () => void;
  unknownErrorMessage: string;
  /** When true, modal closes before the server action runs. */
  closeBeforeSubmit?: boolean;
}

export function useEntityFormSubmit<T extends FieldValues, Payload, Result, Handle = void>({
  isEditMode,
  submissionKey,
  editId,
  onClose,
  buildPayload,
  createAction,
  updateAction,
  applyCreateOptimistic,
  commitCreate,
  rollbackCreate,
  applyUpdateOptimistic,
  commitUpdate,
  rollbackUpdate,
  getSuccessToast,
  errorToast,
  formatErrorDescription,
  refreshAfterSuccess,
  refreshAfterUncertain,
  unknownErrorMessage,
  closeBeforeSubmit = false,
}: UseEntityFormSubmitOptions<T, Payload, Result, Handle>) {
  const tStatus = useTranslations('FormStatus');
  const scope = submissionKey ? `${submissionKey}:${isEditMode ? editId : 'create'}` : null;
  const currentScope = useRef(scope);
  const mounted = useRef(true);
  useEffect(() => {
    currentScope.current = scope;
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, [scope]);
  const localPending = useRef(false);
  return useCallback(
    async (values: T, form: UseFormReturn<T>) => {
      if (localPending.current || (scope && pendingSubmissions.has(scope))) {
        form.setError('root', { message: tStatus('pending') });
        return;
      }
      let handle: Handle | undefined;
      let timedOut = false;
      const canUpdateForm = () => mounted.current && currentScope.current === scope;
      const rollback = (message: string) => {
        if (handle === undefined) return;
        if (isEditMode && editId) rollbackUpdate?.(handle, message);
        else rollbackCreate?.(handle, message);
      };
      const fail = (error: unknown) => {
        const raw = error instanceof Error ? error.message : unknownErrorMessage;
        const message = isTechnicalError(raw) ? tStatus('error') : raw;
        rollback(message);
        if (!closeBeforeSubmit && canUpdateForm()) form.setError('root', { message });
        toast({ title: errorToast.title, description: message, variant: 'destructive' });
      };
      try {
        const payload = buildPayload(values);
        localPending.current = true;
        if (scope) pendingSubmissions.add(scope);
        handle =
          isEditMode && editId
            ? applyUpdateOptimistic?.(editId, payload)
            : applyCreateOptimistic?.(payload);
        if (closeBeforeSubmit) onClose();

        // Observe the actual action until it settles, even after the UI deadline.
        const request = (async () => {
          try {
            const result = await (isEditMode && editId
              ? updateAction(editId, payload)
              : createAction(payload));
            if (result.error) {
              const message = isTechnicalError(result.error) ? tStatus('error') : result.error;
              rollback(message);
              if (!closeBeforeSubmit && canUpdateForm()) form.setError('root', { message });
              toast({
                title: errorToast.title,
                description:
                  formatErrorDescription?.(message, isEditMode) ??
                  errorToast.description ??
                  message,
                variant: 'destructive',
              });
              return;
            }
            if (result.data && handle !== undefined) {
              if (isEditMode && editId) commitUpdate?.(handle, result.data);
              else commitCreate?.(handle, result.data);
            }
            if (!closeBeforeSubmit && canUpdateForm()) onClose();
            toast({ ...getSuccessToast(isEditMode), variant: 'success' });
            if (!timedOut) refreshAfterSuccess?.();
          } catch (error) {
            fail(error);
          } finally {
            localPending.current = false;
            if (scope) pendingSubmissions.delete(scope);
            // Refresh after a late failure too, to reconcile authoritative data.
            if (timedOut) (refreshAfterUncertain ?? refreshAfterSuccess)?.();
          }
        })();
        await withDeadline(request);
      } catch (error) {
        if (error instanceof ActionTimeoutError) {
          timedOut = true;
          const message = tStatus('pending');
          // No rollback: a timeout does not establish that the write failed.
          if (!closeBeforeSubmit && canUpdateForm()) form.setError('root', { message });
          toast({ title: errorToast.title, description: message, variant: 'destructive' });
          (refreshAfterUncertain ?? refreshAfterSuccess)?.();
        } else {
          localPending.current = false;
          if (scope) pendingSubmissions.delete(scope);
          fail(error);
        }
      }
    },
    [
      isEditMode,
      scope,
      editId,
      onClose,
      buildPayload,
      createAction,
      updateAction,
      applyCreateOptimistic,
      commitCreate,
      rollbackCreate,
      applyUpdateOptimistic,
      commitUpdate,
      rollbackUpdate,
      getSuccessToast,
      errorToast,
      formatErrorDescription,
      refreshAfterSuccess,
      refreshAfterUncertain,
      unknownErrorMessage,
      closeBeforeSubmit,
      tStatus,
    ]
  );
}
