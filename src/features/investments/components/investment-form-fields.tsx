'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormField, FormSelect } from '@/components/form';
import { DateField } from '@/components/ui/fields';
import { Input } from '@/components/ui';
import { ModalSection } from '@/components/ui/modal-wrapper';
import { transactionStyles } from '@/styles/system';

export type InvestmentFormData = {
  name: string;
  symbol: string;
  amount: string;
  tax_paid: string;
  shares: string;
  created_at: string;
  currency: 'EUR' | 'USD';
};

interface InvestmentFormFieldsProps {
  form: UseFormReturn<InvestmentFormData>;
  loadError: string | null;
  onRetryLoad: () => void;
}

export function InvestmentFormFields({ form, loadError, onRetryLoad }: InvestmentFormFieldsProps) {
  const t = useTranslations('Investments.AddModal');
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const watchedDate = watch('created_at');
  const watchedCurrency = watch('currency');
  const currencyOptions = [
    { value: 'EUR', label: 'EUR' },
    { value: 'USD', label: 'USD' },
  ];

  return (
    <>
      {loadError ? (
        <div className={cn(transactionStyles.form.error, 'flex flex-col gap-3')}>
          <p className={transactionStyles.form.errorText}>{loadError}</p>
          <button
            type="button"
            className="w-full min-h-11 rounded-md border px-3 text-sm sm:w-auto"
            onClick={onRetryLoad}
          >
            {t('retryLoad')}
          </button>
        </div>
      ) : null}

      <ModalSection title={t('sections.identity')}>
        <div className={transactionStyles.form.grid}>
          <FormField label={t('fields.name')} required error={errors.name?.message}>
            <Input {...register('name')} placeholder={t('placeholders.name')} />
          </FormField>
          <FormField
            label={t('fields.symbol')}
            required
            error={errors.symbol?.message}
            helperText={t('fields.symbolHelper')}
          >
            <Input {...register('symbol')} placeholder={t('placeholders.symbol')} />
          </FormField>
        </div>
      </ModalSection>

      <ModalSection title={t('sections.amounts')}>
        <div className={transactionStyles.form.grid}>
          <FormField label={t('fields.investedAmount')} required error={errors.amount?.message}>
            <Input
              {...register('amount')}
              type="number"
              step="0.01"
              placeholder={t('placeholders.amount')}
            />
          </FormField>
          <FormField label={t('fields.taxesPaid')} error={errors.tax_paid?.message}>
            <Input
              {...register('tax_paid')}
              type="number"
              step="0.01"
              placeholder={t('placeholders.tax')}
            />
          </FormField>
          <FormField label={t('fields.sharesAcquired')} required error={errors.shares?.message}>
            <Input
              {...register('shares')}
              type="number"
              step="0.000001"
              placeholder={t('placeholders.shares')}
            />
          </FormField>
        </div>
      </ModalSection>

      <ModalSection title={t('sections.when')}>
        <div className={transactionStyles.form.grid}>
          <DateField
            value={watchedDate}
            onChange={(val) => setValue('created_at', val)}
            error={errors.created_at?.message}
            label={t('fields.purchaseDate')}
            required
          />
          <div className="space-y-1">
            <FormSelect
              value={watchedCurrency}
              onValueChange={(val) => setValue('currency', val as 'EUR' | 'USD')}
              options={currencyOptions}
              captionLabel={t('fields.currency')}
              leadingIcon={<Coins className="h-5 w-5 text-[#8fb0ff]" aria-hidden />}
            />
            {errors.currency?.message ? (
              <p className="text-sm text-destructive">{errors.currency.message}</p>
            ) : null}
          </div>
        </div>
      </ModalSection>
    </>
  );
}
