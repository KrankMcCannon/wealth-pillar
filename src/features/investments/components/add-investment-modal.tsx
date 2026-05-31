'use client';

import { useCallback, useMemo } from 'react';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import {
  createInvestmentAction,
  getInvestmentByIdAction,
  updateInvestmentAction,
} from '@/features/investments/actions/investment-actions';
import { EntityFormModal, useEntityFormRowReset, useEntityFormSubmit } from '@/components/form';
import { ModalFooterActions } from '@/components/ui/modal-footer-actions';
import { toast } from '@/hooks/use-toast';
import { transactionStyles } from '@/features/transactions/theme/transaction-styles';
import { InvestmentFormFields, type InvestmentFormData } from './investment-form-fields';
import {
  buildInvestmentPayload,
  mapInvestmentToFormData,
} from '@/features/investments/utils/investment-form-data';

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
  const investmentSchema = useMemo(() => createInvestmentSchema(t), [t]);
  const isEditMode = Boolean(editId);

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

  const handleLoadError = useCallback(() => {
    toast({
      title: t('toast.errorTitle'),
      description: t('toast.loadError'),
      variant: 'destructive',
    });
  }, [t]);

  const loadEditValues = useCallback(
    async (id: string, signal: AbortSignal) => {
      const res = await getInvestmentByIdAction(id);
      if (signal.aborted) return null;
      if (res.error || !res.data) {
        const msg =
          res.error === 'NOT_FOUND'
            ? t('toast.notFound')
            : res.error === 'UNAUTHENTICATED'
              ? t('toast.errorTitle')
              : (res.error ?? t('toast.loadError'));
        toast({ title: t('toast.errorTitle'), description: msg, variant: 'destructive' });
        return null;
      }
      return mapInvestmentToFormData(res.data);
    },
    [t]
  );

  const { resetValues, isReady, isLoading, loadFailed, retryLoad } = useEntityFormRowReset({
    editId,
    createValues: createDefaults,
    loadEditValues,
    onLoadError: handleLoadError,
  });

  const buildPayload = useCallback((data: InvestmentFormData) => buildInvestmentPayload(data), []);

  const getSuccessToast = useCallback(
    (edit: boolean) =>
      edit
        ? { title: t('toast.updatedTitle'), description: t('toast.updatedDescription') }
        : { title: t('toast.createdTitle'), description: t('toast.createdDescription') },
    [t]
  );

  const handleSubmit = useEntityFormSubmit({
    isEditMode,
    editId,
    onClose,
    buildPayload,
    createAction: createInvestmentAction,
    updateAction: (id, payload) => updateInvestmentAction({ id, ...payload }),
    getSuccessToast,
    errorToast: { title: t('toast.errorTitle') },
    unknownErrorMessage: t('toast.saveError'),
    closeBeforeSubmit: !isEditMode,
  });

  const title = isEditMode ? t('title.edit') : t('title.create');
  const description = isEditMode ? t('description.edit') : t('description.create');

  return (
    <EntityFormModal<InvestmentFormData>
      key={`${editId ?? 'create'}-${isReady ? 'ready' : 'pending'}`}
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      schema={investmentSchema}
      defaultValues={createDefaults}
      resetValues={resetValues ?? createDefaults}
      repositionInputs={false}
      isLoading={Boolean(editId) && (isLoading || !isReady)}
      formClassName={transactionStyles.form.container}
      onSubmit={handleSubmit}
      footer={(_, isSubmitting) => (
        <ModalFooterActions
          variant="dual"
          cancelLabel={t('cancelButton')}
          submitLabel={t('saveButton')}
          onCancel={onClose}
          submitType="submit"
          isSubmitting={isSubmitting}
          disabled={loadFailed || (Boolean(editId) && (isLoading || !isReady))}
        />
      )}
    >
      {(form) => (
        <InvestmentFormFields
          form={form}
          loadError={loadFailed ? t('toast.loadError') : null}
          onRetryLoad={retryLoad}
        />
      )}
    </EntityFormModal>
  );
}
