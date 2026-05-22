'use client';

import type { useTranslations } from 'next-intl';
import { ArrowLeftRight, CalendarClock } from 'lucide-react';
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
      <div className="grid grid-cols-1 gap-3">
        <ModalSelectField
          control={control}
          name="type"
          label={t('fields.type.label')}
          options={[
            { value: 'expense', label: t('typeOptions.expense') },
            { value: 'income', label: t('typeOptions.income') },
          ]}
          leadingIcon={<ArrowLeftRight className="h-5 w-5 text-primary" aria-hidden />}
          disabled={isSubmitting}
        />

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
          leadingIcon={<CalendarClock className="h-5 w-5 text-primary" aria-hidden />}
          disabled={isSubmitting}
        />
      </div>

      <ModalTextField
        control={control}
        name="due_day"
        label={t('fields.dueDay.label')}
        type="number"
        placeholder={t('fields.dueDay.placeholder')}
        disabled={isSubmitting}
        hint={t('fields.dueDay.helper')}
      />
    </>
  );
}
