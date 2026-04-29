'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Coins } from 'lucide-react';
import { ModalWrapper, ModalBody, ModalFooter, ModalSection } from '@/components/ui/modal-wrapper';
import { FormActions, FormField, FormSelect } from '@/components/form';
import { DateField } from '@/components/ui/fields';
import { Button, Input } from '@/components/ui';
import {
  createInvestmentAction,
  getInvestmentByIdAction,
  updateInvestmentAction,
} from '@/features/investments/actions/investment-actions';
import { transactionStyles } from '@/styles/system';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

type InvestmentFormData = z.infer<ReturnType<typeof createInvestmentSchema>>;

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
      created_at: new Date().toISOString().split('T')[0] as string,
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

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const run = async () => {
      await Promise.resolve();
      if (cancelled) return;

      setLoadError(null);

      if (!editId) {
        setIsLoadingRow(false);
        reset({
          name: '',
          symbol: '',
          amount: '',
          tax_paid: '0',
          shares: '',
          currency: 'EUR',
          created_at: new Date().toISOString().split('T')[0] as string,
        });
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

        reset({
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

    run().catch(() => {
      /* Rejections are handled inside run; this only satisfies no-floating-promises */
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, editId, reset, t, loadRetryToken]);

  const onSubmit = async (data: InvestmentFormData) => {
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
        reset();
        onClose();
        return;
      }

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
      reset();
      onClose();

      try {
        const res = await createInvestmentAction(payload);
        if (res.error) {
          toast({ title: t('toast.errorTitle'), description: res.error, variant: 'destructive' });
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
      toast({ title: t('toast.errorTitle'), description: message, variant: 'destructive' });
    }
  };

  const title = isEditMode ? t('title.edit') : t('title.create');
  const description = isEditMode ? t('description.edit') : t('description.create');

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onClose}
      title={title}
      description={description}
      maxWidth="md"
      repositionInputs={false}
      isLoading={Boolean(editId) && isLoadingRow}
    >
      <form
        onSubmit={handleSubmit((data: InvestmentFormData) => onSubmit(data))}
        className={cn(transactionStyles.form.container, 'flex min-h-0 flex-1 flex-col')}
      >
        <ModalBody className={transactionStyles.modal.content}>
          {loadError && (
            <div className={cn(transactionStyles.form.error, 'flex flex-col gap-3')}>
              <p className={transactionStyles.form.errorText}>{loadError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full min-h-11 sm:w-auto"
                onClick={() => {
                  setLoadError(null);
                  setLoadRetryToken((n) => n + 1);
                }}
              >
                {t('retryLoad')}
              </Button>
            </div>
          )}

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
                  leadingIcon={<Coins className="h-5 w-5 text-[#b8c5ff]" aria-hidden />}
                />
                {errors.currency?.message ? (
                  <p className="text-sm text-destructive">{errors.currency.message}</p>
                ) : null}
              </div>
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
            disabled={Boolean(loadError) || (Boolean(editId) && isLoadingRow)}
            className="w-full sm:w-auto"
          />
        </ModalFooter>
      </form>
    </ModalWrapper>
  );
}
