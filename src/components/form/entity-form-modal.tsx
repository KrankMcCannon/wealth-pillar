'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  type DefaultValues,
  type FieldValues,
  type Resolver,
  type UseFormReturn,
  useForm,
} from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { withDeadline, ActionTimeoutError } from '@/lib/utils/with-deadline';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import type { ZodType } from 'zod';
import { cn } from '@/lib/utils';
import {
  ModalWrapper,
  ModalBody,
  ModalFooter,
  type ModalWrapperProps,
} from '@/components/ui/modal-wrapper';
import { FieldGroup } from '@/components/ui/field';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { ModalRootError } from './modal-fields/modal-root-error';
import { formModalStyles } from './form-modal-styles';

export type EntityFormModalWrapperProps = Omit<
  ModalWrapperProps,
  'isOpen' | 'onOpenChange' | 'title' | 'children' | 'isLoading'
>;

export interface EntityFormModalDeletionProps {
  enabled: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onDelete: () => Promise<void>;
  testId?: string;
}

export interface EntityFormModalFooterActions {
  openDeleteDialog?: () => void;
}

export interface EntityFormModalProps<T extends FieldValues> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  schema: ZodType<T>;
  defaultValues: DefaultValues<T>;
  resetValues?: DefaultValues<T>;
  onSubmit: (values: T, form: UseFormReturn<T>, signal: AbortSignal) => Promise<void>;
  children: (form: UseFormReturn<T>) => ReactNode;
  footer?: (
    form: UseFormReturn<T>,
    isSubmitting: boolean,
    actions: EntityFormModalFooterActions
  ) => ReactNode;
  deletion?: EntityFormModalDeletionProps;
  disableOutsideClose?: boolean;
  repositionInputs?: boolean;
  formClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  wrapperProps?: EntityFormModalWrapperProps;
  isLoading?: boolean;
  autoRootError?: boolean;
  loadFailed?: boolean;
  onRetryLoad?: () => void;
}

export function EntityFormModal<T extends FieldValues>({
  isOpen,
  onClose,
  title,
  description,
  schema,
  defaultValues,
  resetValues,
  onSubmit,
  children,
  footer,
  deletion,
  disableOutsideClose = false,
  repositionInputs = false,
  formClassName = formModalStyles.formColumn,
  bodyClassName = formModalStyles.scrollBody,
  footerClassName = formModalStyles.stickyFooter,
  wrapperProps,
  isLoading = false,
  autoRootError = true,
  loadFailed = false,
  onRetryLoad,
}: EntityFormModalProps<T>) {
  const tStatus = useTranslations('FormStatus');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<T>({
    resolver: zodResolver(schema as never) as Resolver<T>,
    defaultValues,
  });

  const { reset } = form;
  const { isDirty, isSubmitting } = form.formState;
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  useEffect(() => {
    if (isOpen && !isLoading && !isDirty && !isSubmitting && !hasErrors) {
      reset(resetValues ?? defaultValues);
    }
  }, [isOpen, isLoading, resetValues, defaultValues, reset, isDirty, isSubmitting, hasErrors]);

  const openDeleteDialog = useCallback(() => {
    if (deletion?.enabled) {
      setDeleteOpen(true);
    }
  }, [deletion?.enabled]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletion) return;
    setIsDeleting(true);
    try {
      await withDeadline(deletion.onDelete());
      setDeleteOpen(false);
      onClose();
    } catch (error) {
      setDeleteOpen(false);
      form.setError('root', {
        message: tStatus(error instanceof ActionTimeoutError ? 'timeout' : 'error'),
      });
    } finally {
      setIsDeleting(false);
    }
  }, [deletion, onClose, form, tStatus]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (isLoading || loadFailed) return;
    const controller = new AbortController();
    try {
      // Action boundaries time out first; this also protects custom submit handlers.
      await withDeadline(onSubmit(values, form, controller.signal), 25_000);
    } catch (error) {
      form.setError('root', {
        message: tStatus(error instanceof ActionTimeoutError ? 'timeout' : 'error'),
      });
    } finally {
      controller.abort();
    }
  });

  const footerActions: EntityFormModalFooterActions = deletion?.enabled ? { openDeleteDialog } : {};
  const formOpen = isOpen && !deleteOpen;

  return (
    <>
      <ModalWrapper
        isOpen={formOpen}
        onOpenChange={onClose}
        title={title}
        {...(description !== undefined ? { description } : {})}
        disableOutsideClose={disableOutsideClose || isDeleting || form.formState.isSubmitting}
        repositionInputs={repositionInputs}
        isLoading={isLoading}
        {...wrapperProps}
        leadingAction={
          deletion?.enabled ? (
            <button
              type="button"
              data-testid={deletion.testId}
              disabled={form.formState.isSubmitting || isDeleting}
              onClick={openDeleteDialog}
              className={formModalStyles.shell.leadingButton}
              aria-label={deletion.title}
            >
              <Trash2 className="size-5" aria-hidden />
            </button>
          ) : undefined
        }
      >
        <form onSubmit={handleSubmit} className={cn('flex min-h-0 flex-1 flex-col', formClassName)}>
          <ModalBody className={bodyClassName}>
            <FieldGroup className={formModalStyles.fieldsColumn}>
              {loadFailed ? (
                <div role="alert">
                  <p>{tStatus('loadError')}</p>
                  <button type="button" onClick={onRetryLoad} className="underline">
                    {tStatus('retry')}
                  </button>
                </div>
              ) : null}
              {autoRootError && form.formState.errors.root?.message ? (
                <ModalRootError message={form.formState.errors.root.message} />
              ) : null}
              {!loadFailed && children(form)}
            </FieldGroup>
          </ModalBody>
          {footer ? (
            <ModalFooter className={footerClassName}>
              {footer(form, form.formState.isSubmitting, footerActions)}
            </ModalFooter>
          ) : null}
        </form>
      </ModalWrapper>

      {deletion ? (
        <ConfirmationDialog
          isOpen={deleteOpen}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteOpen(false)}
          title={deletion.title}
          message={deletion.message}
          {...(deletion.confirmText !== undefined ? { confirmText: deletion.confirmText } : {})}
          {...(deletion.cancelText !== undefined ? { cancelText: deletion.cancelText } : {})}
          variant="destructive"
          isLoading={isDeleting}
        />
      ) : null}
    </>
  );
}
