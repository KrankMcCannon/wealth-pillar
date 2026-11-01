'use client';

import type { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { ModalRadioField } from '@/components/form/modal-fields/modal-radio-field';
import { ModalSelectField } from '@/components/form/modal-fields/modal-select-field';
import { ModalTextField } from '@/components/form/modal-fields/modal-text-field';
import type { RecurringFormData } from './recurring-form-schema';
import { financialDateTime } from '@/lib/utils/financial-date';

export interface RecurrencePickerProps {
  form: UseFormReturn<RecurringFormData>;
  t: ReturnType<typeof useTranslations<'Recurring.FormModal'>>;
  isSubmitting: boolean;
}

export function RecurrencePicker({ form, t, isSubmitting }: RecurrencePickerProps) {
  const { control } = form;
  const frequency = useWatch({ control, name: 'frequency' });
  const weekly = frequency === 'weekly' || frequency === 'biweekly';
  const dueDay = useWatch({ control, name: 'due_day' });

  return (
    <>
      <ModalRadioField
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
        onValueChange={(next) => {
          const nextWeekly = next === 'weekly' || next === 'biweekly';
          if (weekly === nextWeekly && frequency !== 'once' && next !== 'once') return;
          const start = financialDateTime(form.getValues('start_date') || new Date());
          form.setValue('due_day', String(nextWeekly ? start.weekday : start.day), {
            shouldDirty: true,
            shouldValidate: true,
          });
        }}
      />

      {weekly ? (
        <ModalSelectField
          control={control}
          name="due_day"
          label={t('fields.weekday.label')}
          options={Array.from({ length: 7 }, (_, index) => ({
            value: String(index + 1),
            label: t(`weekdays.${index + 1}`),
          }))}
          disabled={isSubmitting}
        />
      ) : frequency !== 'once' ? (
        <ModalTextField
          control={control}
          name="due_day"
          label={t('fields.dueDay.label')}
          type="number"
          placeholder={t('fields.dueDay.placeholder')}
          disabled={isSubmitting}
        />
      ) : null}
      {!weekly && frequency !== 'once' && Number(dueDay) > 28 ? (
        <p className="px-4 text-sm text-muted-foreground">{t('scheduleHelp.monthly')}</p>
      ) : null}
    </>
  );
}
