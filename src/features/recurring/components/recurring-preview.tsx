'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { useTranslations } from 'next-intl';
import { ModalAmountField } from '@/components/form/modal-fields';
import type { RecurringFormData } from './recurring-form-schema';

export interface RecurringPreviewProps {
  form: UseFormReturn<RecurringFormData>;
  t: ReturnType<typeof useTranslations<'Recurring.FormModal'>>;
  isSubmitting: boolean;
}

export function RecurringPreview({ form, t, isSubmitting }: RecurringPreviewProps) {
  const { control } = form;

  return (
    <ModalAmountField
      control={control}
      name="amount"
      label={t('fields.amount.label')}
      disabled={isSubmitting}
      placeholder={t('fields.amount.placeholder')}
    />
  );
}
