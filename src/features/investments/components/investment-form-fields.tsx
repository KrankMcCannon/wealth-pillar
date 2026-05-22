'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FieldGroup } from '@/components/ui/field';
import { ModalDateField, ModalSelectField, ModalTextField } from '@/components/form/modal-fields';
import { ModalSection } from '@/components/ui/modal-wrapper';
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

      <ModalSection title={t('sections.identity')}>
        <FieldGroup className="gap-4">
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
        </FieldGroup>
      </ModalSection>

      <ModalSection title={t('sections.amounts')}>
        <FieldGroup className="gap-4">
          <ModalTextField
            control={control}
            name="amount"
            label={t('fields.investedAmount')}
            type="number"
            placeholder={t('placeholders.amount')}
          />
          <ModalTextField
            control={control}
            name="tax_paid"
            label={t('fields.taxesPaid')}
            type="number"
            placeholder={t('placeholders.tax')}
          />
          <ModalTextField
            control={control}
            name="shares"
            label={t('fields.sharesAcquired')}
            type="number"
            placeholder={t('placeholders.shares')}
          />
        </FieldGroup>
      </ModalSection>

      <ModalSection title={t('sections.when')}>
        <FieldGroup className="gap-4">
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
            leadingIcon={<Coins aria-hidden />}
          />
        </FieldGroup>
      </ModalSection>
    </>
  );
}
