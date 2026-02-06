'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { ModalWrapper, ModalBody, ModalFooter, ModalSection } from '@/components/ui/modal-wrapper';
import { FormActions, FormField, FormSelect } from '@/components/form';
import { DateField } from '@/components/ui/fields';
import { Input } from '@/components/ui/input';
import { createInvestmentAction } from '@/features/investments/actions/investment-actions';
import { transactionStyles } from '@/styles/system';
import { cn } from '@/lib/utils';

// Schema definition
const createInvestmentSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    name: z.string().min(1, t('validation.nameRequired')),
    symbol: z.string().min(1, t('validation.symbolRequired')),
    amount: z
      .string()
      .refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, t('validation.amountInvalid')),
    tax_paid: z
      .string()
      .refine(
        (val) => !Number.isNaN(Number(val)) && Number(val) >= 0,
        t('validation.taxInvalid')
      ),
    shares: z
      .string()
      .refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, t('validation.sharesInvalid')),
    created_at: z.string().min(1, t('validation.dateRequired')),
    currency: z.enum(['EUR', 'USD']),
  });

type InvestmentFormData = z.infer<ReturnType<typeof createInvestmentSchema>>;

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddInvestmentModal({ isOpen, onClose }: Readonly<AddInvestmentModalProps>) {
  const t = useTranslations('Investments.AddModal');
  const investmentSchema = React.useMemo(() => createInvestmentSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      name: '',
      symbol: '',
      amount: '',
      tax_paid: '0',
      shares: '',
      currency: 'EUR',
      created_at: new Date().toISOString().split('T')[0],
    },
  });

  const watchedDate = useWatch({ control, name: 'created_at' });
  const watchedCurrency = useWatch({
    control,
    name: 'currency',
  });
  const currencyOptions = [
    { value: 'EUR', label: 'EUR' },
    { value: 'USD', label: 'USD' },
  ];

  const onSubmit = async (data: InvestmentFormData) => {
    try {
      const res = await createInvestmentAction({
        name: data.name,
        symbol: data.symbol.toUpperCase(),
        amount: Number(data.amount),
        shares_acquired: Number(data.shares),
        currency: data.currency,
        created_at: new Date(data.created_at),
        // Taxes paid for the purchase
        tax_paid: Number(data.tax_paid) || 0,
        // Defaults
        currency_rate: 1,
        net_earn: 0,
      });

      if (!res.error) {
        reset();
        onClose();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onClose}
      title={t('title')}
      description={t('description')}
      maxWidth="md"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={cn(transactionStyles.form.container, 'flex flex-col h-full')}
      >
        <ModalBody className={transactionStyles.modal.content}>
          <ModalSection>
            <div className={transactionStyles.form.grid}>
              <FormField label={t('fields.name')} required error={errors.name?.message}>
                <Input {...register('name')} placeholder={t('placeholders.name')} />
              </FormField>

              <FormField label={t('fields.symbol')} required error={errors.symbol?.message}>
                <Input {...register('symbol')} placeholder={t('placeholders.symbol')} />
              </FormField>

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

              <DateField
                value={watchedDate}
                onChange={(val) => setValue('created_at', val)}
                error={errors.created_at?.message}
                label={t('fields.purchaseDate')}
                required
              />

              <FormField label={t('fields.currency')} required error={errors.currency?.message}>
                <FormSelect
                  value={watchedCurrency}
                  onValueChange={(val) => setValue('currency', val as 'EUR' | 'USD')}
                  options={currencyOptions}
                />
              </FormField>
            </div>
          </ModalSection>
        </ModalBody>

        <ModalFooter>
          <FormActions
            submitType="submit"
            submitLabel={t('saveButton')}
            cancelLabel={t('cancelButton')}
            onCancel={onClose}
            isSubmitting={isSubmitting}
            className="w-full sm:w-auto"
          />
        </ModalFooter>
      </form>
    </ModalWrapper>
  );
}
