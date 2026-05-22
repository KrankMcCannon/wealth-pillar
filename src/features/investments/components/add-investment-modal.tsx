'use client';

import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import {
  createInvestmentAction,
  getInvestmentByIdAction,
  updateInvestmentAction,
} from '@/features/investments/actions/investment-actions';
import { EntityFormModal } from '@/components/form/entity-form-modal';
import { FormActions } from '@/components/form';
import { toast } from '@/hooks/use-toast';
import { transactionStyles } from '@/features/transactions/theme/transaction-styles';
import { InvestmentFormFields, type InvestmentFormData } from './investment-form-fields';

const createInvestmentSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    name: z.string().min(1, t('validation.nameRequired')),
    symbol: z.string().min(1, t('validation.symbolRequired')),
    amount: z
      .string()
      .refine(
        (val) => !Number.isNaN(Number(val)) && Number(val) > 0,
        t('validation.amountInvalid')
      ),
    tax_paid: z
      .string()
      .refine((val) => !Number.isNaN(Number(val)) && Number(val) >= 0, t('validation.taxInvalid')),
    shares: z
      .string()
      .refine(
        (val) => !Number.isNaN(Number(val)) && Number(val) > 0,
        t('validation.sharesInvalid')
      ),
    created_at: z.string().min(1, t('validation.dateRequired')),
    currency: z.enum(['EUR', 'USD']),
  });

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

export default function AddInvestmentModal({
  isOpen,
  onClose,
  editId,
}: Readonly<AddInvestmentModalProps>) {
  const t = useTranslations('Investments.AddModal');
  const router = useRouter();
  const investmentSchema = useMemo(() => createInvestmentSchema(t), [t]);
  const isEditMode = Boolean(editId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingRow, setIsLoadingRow] = useState(false);
  const [loadRetryToken, setLoadRetryToken] = useState(0);
  const [resetValues, setResetValues] = useState<InvestmentFormData | undefined>(undefined);

  const createDefaults: InvestmentFormData = useMemo(
    () => ({
      name: '',
      symbol: '',
      amount: '',
      tax_paid: '0',
      shares: '',
      currency: 'EUR',
      created_at: new Date().toISOString().split('T')[0] as string,
    }),
    []
  );

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const run = async () => {
      setLoadError(null);

      if (!editId) {
        setIsLoadingRow(false);
        setResetValues(createDefaults);
        return;
      }

      setIsLoadingRow(true);

      try {
        const res = await getInvestmentByIdAction(editId);
        if (cancelled) return;
        setIsLoadingRow(false);

        if (res.error || !res.data) {
          const msg =
            res.error === 'NOT_FOUND'
              ? t('toast.notFound')
              : res.error === 'UNAUTHENTICATED'
                ? t('toast.errorTitle')
                : (res.error ?? t('toast.loadError'));
          setLoadError(msg);
          toast({ title: t('toast.errorTitle'), description: msg, variant: 'destructive' });
          return;
        }

        const row = res.data;
        const fallbackDay = new Date().toISOString().slice(0, 10);
        const dateStr =
          row.created_at === null
            ? fallbackDay
            : (row.created_at.toISOString().split('T')[0] ?? fallbackDay);
        const currency: 'EUR' | 'USD' = row.currency === 'USD' ? 'USD' : 'EUR';

        setResetValues({
          name: row.name,
          symbol: row.symbol,
          amount: String(row.amount),
          tax_paid: String(row.tax_paid ?? 0),
          shares: String(row.shares_acquired),
          currency,
          created_at: dateStr,
        });
      } catch {
        if (!cancelled) {
          setIsLoadingRow(false);
          setLoadError(t('toast.loadError'));
        }
      }
    };

    run().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [isOpen, editId, t, loadRetryToken, createDefaults]);

  const title = isEditMode ? t('title.edit') : t('title.create');
  const description = isEditMode ? t('description.edit') : t('description.create');

  return (
    <EntityFormModal<InvestmentFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      schema={investmentSchema}
      defaultValues={createDefaults}
      resetValues={resetValues ?? createDefaults}
      repositionInputs={false}
      isLoading={Boolean(editId) && isLoadingRow}
      formClassName={transactionStyles.form.container}
      onSubmit={async (data, form) => {
        try {
          if (isEditMode && editId) {
            const res = await updateInvestmentAction({
              id: editId,
              name: data.name,
              symbol: data.symbol,
              amount: Number(data.amount),
              shares_acquired: Number(data.shares),
              currency: data.currency,
              created_at: new Date(data.created_at),
              tax_paid: Number(data.tax_paid) || 0,
              currency_rate: 1,
              net_earn: 0,
            });

            if (res.error) {
              toast({
                title: t('toast.errorTitle'),
                description: res.error,
                variant: 'destructive',
              });
              return;
            }
            toast({
              title: t('toast.updatedTitle'),
              description: t('toast.updatedDescription'),
              variant: 'success',
            });
            onClose();
            router.refresh();
            return;
          }

          onClose();

          const payload = {
            name: data.name,
            symbol: data.symbol.toUpperCase(),
            amount: Number(data.amount),
            shares_acquired: Number(data.shares),
            currency: data.currency,
            created_at: new Date(data.created_at),
            tax_paid: Number(data.tax_paid) || 0,
            currency_rate: 1,
            net_earn: 0,
          };

          try {
            const res = await createInvestmentAction(payload);
            if (res.error) {
              toast({
                title: t('toast.errorTitle'),
                description: res.error,
                variant: 'destructive',
              });
              return;
            }
            toast({
              title: t('toast.createdTitle'),
              description: t('toast.createdDescription'),
              variant: 'success',
            });
            router.refresh();
          } catch (createErr) {
            const message = createErr instanceof Error ? createErr.message : t('toast.saveError');
            toast({ title: t('toast.errorTitle'), description: message, variant: 'destructive' });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : t('toast.saveError');
          form.setError('root', { message });
          toast({ title: t('toast.errorTitle'), description: message, variant: 'destructive' });
        }
      }}
      footer={(_, isSubmitting) => (
        <FormActions
          submitType="submit"
          submitLabel={t('saveButton')}
          cancelLabel={t('cancelButton')}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          disabled={Boolean(loadError) || (Boolean(editId) && isLoadingRow)}
          className="w-full sm:w-auto"
        />
      )}
    >
      {(form) => (
        <InvestmentFormFields
          form={form}
          loadError={loadError}
          onRetryLoad={() => {
            setLoadError(null);
            setLoadRetryToken((n) => n + 1);
          }}
        />
      )}
    </EntityFormModal>
  );
}
