'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { withDeadline, ActionTimeoutError, isTechnicalError } from '@/lib/utils/with-deadline';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';

export type EntityFormActionResult<R> = { data: R | null; error: string | null };

export interface EntityFormSubmitToastMessages {
  success: { title: string; description: string };
  error: { title: string; description?: string };
}

export interface UseEntityFormSubmitOptions<T extends FieldValues, Payload, Result, Handle = void> {
  isEditMode: boolean;
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
  unknownErrorMessage: string;
  /** When true, modal closes before the server action runs. */
  closeBeforeSubmit?: boolean;
}

export function useEntityFormSubmit<T extends FieldValues, Payload, Result, Handle = void>({
  isEditMode,
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
  unknownErrorMessage,
  closeBeforeSubmit = false,
}: UseEntityFormSubmitOptions<T, Payload, Result, Handle>) {
  const tStatus = useTranslations('FormStatus');
  return useCallback(
    async (values: T, form: UseFormReturn<T>) => {
      let handle: Handle | undefined;

      try {
        const payload = buildPayload(values);
        if (isEditMode && editId) {
          handle = applyUpdateOptimistic?.(editId, payload);
        } else {
          handle = applyCreateOptimistic?.(payload);
        }

        if (closeBeforeSubmit) {
          onClose();
        }

        const result = await withDeadline(
          isEditMode && editId ? updateAction(editId, payload) : createAction(payload)
        );

        if (result.error) {
          const message = isTechnicalError(result.error) ? tStatus('error') : result.error;
          if (isEditMode && editId) {
            if (handle !== undefined) {
              rollbackUpdate?.(handle, message);
            }
          } else if (handle !== undefined) {
            rollbackCreate?.(handle, message);
          }

          if (!closeBeforeSubmit) {
            form.setError('root', { message });
          }

          toast({
            title: errorToast.title,
            description:
              formatErrorDescription?.(message, isEditMode) ?? errorToast.description ?? message,
            variant: 'destructive',
          });
          return;
        }

        if (result.data) {
          if (isEditMode && editId) {
            if (handle !== undefined) {
              commitUpdate?.(handle, result.data);
            }
          } else if (handle !== undefined) {
            commitCreate?.(handle, result.data);
          }
        }

        if (!closeBeforeSubmit) {
          onClose();
        }

        const successToast = getSuccessToast(isEditMode);
        toast({
          title: successToast.title,
          description: successToast.description,
          variant: 'success',
        });
        refreshAfterSuccess?.();
      } catch (error) {
        const rawMessage = error instanceof Error ? error.message : unknownErrorMessage;
        const message =
          error instanceof ActionTimeoutError
            ? tStatus('timeout')
            : isTechnicalError(rawMessage)
              ? unknownErrorMessage
              : rawMessage;

        if (isEditMode && editId) {
          if (handle !== undefined) {
            rollbackUpdate?.(handle, message);
          }
        } else if (handle !== undefined) {
          rollbackCreate?.(handle, message);
        }

        if (!closeBeforeSubmit) {
          form.setError('root', { message });
        }

        toast({
          title: errorToast.title,
          description: message,
          variant: 'destructive',
        });
      }
    },
    [
      isEditMode,
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
      unknownErrorMessage,
      closeBeforeSubmit,
      tStatus,
    ]
  );
}
