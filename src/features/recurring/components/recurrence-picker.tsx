'use client';

import type { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';
import { ModalSelectField, ModalTextField } from '@/components/form/modal-fields';
import type { RecurringFormData } from './recurring-form-schema';

export interface RecurrencePickerProps {
  form: UseFormReturn<RecurringFormData>;
  t: ReturnType<typeof useTranslations<'Recurring.FormModal'>>;
  isSubmitting: boolean;
}

export function RecurrencePicker({ form, t, isSubmitting }: RecurrencePickerProps) {
  const { control } = form;

  return (
    <>
      <ModalSelectField
        control={control}
        name="frequency"
        label={t('fields.frequency.label')}
        options={[
          { value: 'once', label: t('frequencyOptions.once') },
          { value: 'weekly', label: t('frequencyOptions.weekly') },
          { value: 'biweekly', label: t('frequencyOptions.biweekly') },
          { value: 'monthly', label: t('frequencyOptions.monthly') },
          { value: 'yearly', label: t('frequencyOptions.yearly') },
        ]}
        disabled={isSubmitting}
      />

      <ModalTextField
        control={control}
        name="due_day"
        label={t('fields.dueDay.label')}
        type="number"
        placeholder={t('fields.dueDay.placeholder')}
        disabled={isSubmitting}
      />
    </>
  );
}
