/**
 * BaseForm - Generic form wrapper component
 * Centralizes common form patterns
 */

"use client";

import { FormActions } from "./form-actions";
import { FormLayout } from "./form-layout";
import { ModalWrapper } from "./modal-wrapper";

interface BaseFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  mode?: 'create' | 'edit';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function BaseForm({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  mode = 'create',
  maxWidth = 'lg',
}: BaseFormProps) {
  const defaultSubmitLabel = mode === 'create' ? 'Crea' : 'Aggiorna';

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      maxWidth={maxWidth}
      footer={
        <FormActions
          submitType="submit"
          submitLabel={submitLabel || defaultSubmitLabel}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      }
    >
      <FormLayout onSubmit={onSubmit}>
        {children}
      </FormLayout>
    </ModalWrapper>
  );
}
