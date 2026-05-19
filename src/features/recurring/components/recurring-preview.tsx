'use client';

import { Controller, type Control, type FieldErrors } from 'react-hook-form';

import type { useTranslations } from 'next-intl';

import { FormCurrencyInput } from '@/components/form';
import { cn } from '@/lib/utils';

import type { RecurringFormData } from './recurring-form-schema';

type Stitch = typeof import('@/styles/home-design-foundation').stitchTransactionFormModal;

export interface RecurringPreviewProps {
  control: Control<RecurringFormData>;
  errors: FieldErrors<RecurringFormData>;
  t: ReturnType<typeof useTranslations<'Recurring.FormModal'>>;
  s: Stitch;
  isSubmitting: boolean;
}

export function RecurringPreview({ control, errors, t, s, isSubmitting }: RecurringPreviewProps) {
  return (
    <section
      className={cn(s.amountSection, 'group/amount')}
      aria-labelledby="recurring-amount-label"
    >
      <p id="recurring-amount-label" className={s.amountEyebrow}>
        {t('fields.amount.label')}
      </p>
      <div className={s.amountRow}>
        <span className={s.amountCurrency} aria-hidden>
          €
        </span>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <FormCurrencyInput
              value={field.value}
              onChange={(v) => field.onChange(v)}
              placeholder={t('fields.amount.placeholder')}
              disabled={isSubmitting}
              className={s.amountInput}
              showSymbol={false}
            />
          )}
        />
      </div>
      <div className={s.amountTrack} aria-hidden>
        <div className={s.amountTrackFill} />
      </div>
      {errors.amount ? <p className={s.fieldError}>{errors.amount.message}</p> : null}
    </section>
  );
}
