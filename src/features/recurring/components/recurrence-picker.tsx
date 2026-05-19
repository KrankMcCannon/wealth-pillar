'use client';

import type { useTranslations } from 'next-intl';
import { ArrowLeftRight, CalendarClock } from 'lucide-react';
import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';

import { FormSelect } from '@/components/form';
import { Input } from '@/components/ui';
import { TransactionFrequencyType } from '@/lib/types';
import { cn } from '@/lib/utils';

import type { RecurringFormData } from './recurring-form-schema';

type Stitch = typeof import('@/styles/home-design-foundation').stitchTransactionFormModal;

export interface RecurrencePickerProps {
  watchedType: RecurringFormData['type'];
  watchedFrequency: RecurringFormData['frequency'];
  setValue: UseFormSetValue<RecurringFormData>;
  register: UseFormRegister<RecurringFormData>;
  errors: FieldErrors<RecurringFormData>;
  t: ReturnType<typeof useTranslations<'Recurring.FormModal'>>;
  s: Stitch;
  isSubmitting: boolean;
}

export function RecurrencePicker({
  watchedType,
  watchedFrequency,
  setValue,
  register,
  errors,
  t,
  s,
  isSubmitting,
}: RecurrencePickerProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3">
        <div className="space-y-1">
          <FormSelect
            value={watchedType}
            onValueChange={(value) => setValue('type', value as 'income' | 'expense')}
            options={[
              { value: 'expense', label: t('typeOptions.expense') },
              { value: 'income', label: t('typeOptions.income') },
            ]}
            captionLabel={t('fields.type.label')}
            leadingIcon={<ArrowLeftRight className="h-5 w-5 text-[#b8c5ff]" aria-hidden />}
          />
          {errors.type?.message ? <p className={s.fieldError}>{errors.type.message}</p> : null}
        </div>

        <div className="space-y-1">
          <FormSelect
            value={watchedFrequency}
            onValueChange={(value) => setValue('frequency', value as TransactionFrequencyType)}
            options={[
              { value: 'once', label: t('frequencyOptions.once') },
              { value: 'weekly', label: t('frequencyOptions.weekly') },
              { value: 'biweekly', label: t('frequencyOptions.biweekly') },
              { value: 'monthly', label: t('frequencyOptions.monthly') },
              { value: 'yearly', label: t('frequencyOptions.yearly') },
            ]}
            captionLabel={t('fields.frequency.label')}
            leadingIcon={<CalendarClock className="h-5 w-5 text-[#b8c5ff]" aria-hidden />}
          />
          {errors.frequency?.message ? (
            <p className={s.fieldError}>{errors.frequency.message}</p>
          ) : null}
        </div>
      </div>

      <div className={s.noteShell}>
        <label htmlFor="recurring-due-day" className={s.noteLabel}>
          {t('fields.dueDay.label')}
        </label>
        <Input
          id="recurring-due-day"
          type="number"
          min={1}
          max={31}
          {...register('due_day')}
          placeholder={t('fields.dueDay.placeholder')}
          disabled={isSubmitting}
          className={s.noteInput}
          autoComplete="off"
        />
        <p className="mt-2 px-0 text-[11px] leading-snug text-[#9fb0d7]/90">
          {t('fields.dueDay.helper')}
        </p>
        {errors.due_day?.message ? (
          <p className={cn(s.fieldError, 'mt-2')}>{errors.due_day.message}</p>
        ) : null}
      </div>
    </>
  );
}
