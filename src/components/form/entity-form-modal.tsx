'use client';

import { useEffect, type ReactNode } from 'react';
import {
  type DefaultValues,
  type FieldValues,
  type Resolver,
  type UseFormReturn,
  useForm,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import { cn } from '@/lib/utils';
import {
  ModalWrapper,
  ModalBody,
  ModalFooter,
  type ModalWrapperProps,
} from '@/components/ui/modal-wrapper';

export type EntityFormModalWrapperProps = Omit<
  ModalWrapperProps,
  'isOpen' | 'onOpenChange' | 'title' | 'children' | 'isLoading'
>;

export interface EntityFormModalProps<T extends FieldValues> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  schema: ZodType<T>;
  defaultValues: DefaultValues<T>;
  /** When open, resets the form to these values (e.g. edit payload or create defaults). */
  resetValues?: DefaultValues<T>;
  onSubmit: (values: T, form: UseFormReturn<T>) => Promise<void>;
  children: (form: UseFormReturn<T>) => ReactNode;
  footer?: (form: UseFormReturn<T>, isSubmitting: boolean) => ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  disableOutsideClose?: boolean;
  repositionInputs?: boolean;
  formClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  wrapperProps?: EntityFormModalWrapperProps;
  isLoading?: boolean;
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
  maxWidth = 'md',
  disableOutsideClose = false,
  repositionInputs = false,
  formClassName,
  bodyClassName,
  footerClassName,
  wrapperProps,
  isLoading = false,
}: EntityFormModalProps<T>) {
  const form = useForm<T>({
    // Zod v4 schema types do not align with @hookform/resolvers overloads under exactOptionalPropertyTypes.
    resolver: zodResolver(schema as never) as Resolver<T>,
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(resetValues ?? defaultValues);
    }
  }, [isOpen, resetValues, defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values, form);
  });

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onClose}
      title={title}
      {...(description !== undefined ? { description } : {})}
      maxWidth={maxWidth}
      disableOutsideClose={disableOutsideClose}
      repositionInputs={repositionInputs}
      isLoading={isLoading}
      {...wrapperProps}
    >
      <form onSubmit={handleSubmit} className={cn('flex min-h-0 flex-1 flex-col', formClassName)}>
        <ModalBody {...(bodyClassName !== undefined ? { className: bodyClassName } : {})}>
          {children(form)}
        </ModalBody>
        {footer ? (
          <ModalFooter {...(footerClassName !== undefined ? { className: footerClassName } : {})}>
            {footer(form, form.formState.isSubmitting)}
          </ModalFooter>
        ) : null}
      </form>
    </ModalWrapper>
  );
}
