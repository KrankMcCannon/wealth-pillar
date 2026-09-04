'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  ModalAmountField,
  ModalDateField,
  ModalSelectField,
  ModalTextField,
} from '@/components/form/modal-fields';
import { formModalStyles as s } from '@/components/form/form-modal-styles';

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
  const { control } = form;

  const currencyOptions = [
    { value: 'EUR', label: 'EUR' },
    { value: 'USD', label: 'USD' },
  ] as const;

  return (
    <>
      {loadError ? (
        <div className={cn(s.errorBanner, 'flex flex-col gap-3')}>
          <p>{loadError}</p>
          <button
            type="button"
            className="w-full min-h-11 rounded-md border border-border px-3 text-sm text-foreground"
            onClick={onRetryLoad}
          >
            {t('retryLoad')}
          </button>
        </div>
      ) : null}

      <div className={s.fieldStack}>
        <ModalTextField
          control={control}
          name="name"
          label={t('fields.name')}
          placeholder={t('placeholders.name')}
        />
        <ModalTextField
          control={control}
          name="symbol"
          label={t('fields.symbol')}
          placeholder={t('placeholders.symbol')}
          hint={t('fields.symbolHelper')}
        />
        <ModalAmountField
          control={control}
          name="amount"
          label={t('fields.investedAmount')}
          variant="inline"
          placeholder={t('placeholders.amount')}
        />
        <ModalAmountField
          control={control}
          name="tax_paid"
          label={t('fields.taxesPaid')}
          variant="inline"
          placeholder={t('placeholders.tax')}
        />
        <ModalTextField
          control={control}
          name="shares"
          label={t('fields.sharesAcquired')}
          type="number"
          placeholder={t('placeholders.shares')}
        />
        <ModalDateField
          control={control}
          name="created_at"
          label={t('fields.purchaseDate')}
          required
        />
        <ModalSelectField
          control={control}
          name="currency"
          label={t('fields.currency')}
          options={[...currencyOptions]}
        />
      </div>
    </>
  );
}
