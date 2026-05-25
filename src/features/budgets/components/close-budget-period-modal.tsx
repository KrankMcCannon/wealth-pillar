'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';
import { EntityFormModal, useEntityFormSubmit } from '@/components/form';
import { ModalDateField } from '@/components/form/modal-fields';
import { ModalFooterActions } from '@/components/ui/modal-footer-actions';
import { closePeriodAction, getActivePeriodAction } from '@/features/budgets';
import { useRouter } from '@/i18n/routing';
import { todayDateString } from '@/lib/utils/date-utils';
import type { BudgetPeriod } from '@/lib/types';

export type CloseBudgetPeriodFormData = {
  end_date: string;
};

interface CloseBudgetPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

function CloseBudgetPeriodFields({
  form,
  periodStartDate,
  salaryHint,
  endDateLabel,
  noActivePeriodAlert,
}: Readonly<{
  form: UseFormReturn<CloseBudgetPeriodFormData>;
  periodStartDate: string | null;
  salaryHint: string;
  endDateLabel: string;
  noActivePeriodAlert: string;
}>) {
  if (!periodStartDate) {
    return <p className="text-sm text-modal-fg-muted">{noActivePeriodAlert}</p>;
  }

  return (
    <>
      <p className="text-sm leading-relaxed text-modal-fg-muted">{salaryHint}</p>
      <ModalDateField control={form.control} name="end_date" label={endDateLabel} required />
    </>
  );
}

function CloseBudgetPeriodModal({
  isOpen,
  onClose,
  userId,
}: Readonly<CloseBudgetPeriodModalProps>) {
  const t = useTranslations('Budgets.PeriodManager');
  const locale = useLocale();
  const router = useRouter();
  const today = todayDateString();

  const [activePeriod, setActivePeriod] = useState<BudgetPeriod | null>(null);
  const [isLoadingPeriod, setIsLoadingPeriod] = useState(true);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;

    getActivePeriodAction(userId, locale)
      .then((result) => {
        if (cancelled) return;
        setActivePeriod(result.data ?? null);
        setIsLoadingPeriod(false);
      })
      .catch(() => {
        if (cancelled) return;
        setActivePeriod(null);
        setIsLoadingPeriod(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, locale]);

  const periodStartDate: string | null = activePeriod?.start_date
    ? typeof activePeriod.start_date === 'string'
      ? (activePeriod.start_date.split('T')[0] ?? null)
      : (activePeriod.start_date.toISOString().split('T')[0] ?? null)
    : null;

  const schema = useMemo(
    () =>
      z.object({
        end_date: z
          .string()
          .min(1, t('errors.selectDate'))
          .refine(
            (value) => {
              if (!periodStartDate) return false;
              return value >= periodStartDate && value <= today;
            },
            { message: t('errors.selectDate') }
          ),
      }),
    [periodStartDate, t, today]
  );

  const defaultValues = useMemo(
    (): CloseBudgetPeriodFormData => ({
      end_date: today,
    }),
    [today]
  );

  const buildPayload = useCallback((data: CloseBudgetPeriodFormData) => data.end_date, []);

  const getSuccessToast = useCallback(
    () => ({
      title: t('buttons.closePeriod'),
      description: t('description'),
    }),
    [t]
  );

  const handleSubmit = useEntityFormSubmit<CloseBudgetPeriodFormData, string, BudgetPeriod>({
    isEditMode: false,
    onClose: handleClose,
    buildPayload,
    createAction: (endDate) => {
      if (!activePeriod?.id) {
        return Promise.resolve({ data: null, error: t('noActivePeriodAlert') });
      }
      return closePeriodAction(userId, activePeriod.id, endDate, locale);
    },
    updateAction: async () => ({ data: null, error: t('errors.operationFailed') }),
    getSuccessToast,
    errorToast: { title: t('errors.operationFailed') },
    refreshAfterSuccess: () => router.refresh(),
    unknownErrorMessage: t('errors.unknown'),
  });

  const wrappedSubmit = useCallback(
    async (values: CloseBudgetPeriodFormData, form: UseFormReturn<CloseBudgetPeriodFormData>) => {
      if (!activePeriod?.id) {
        form.setError('root', { message: t('noActivePeriodAlert') });
        return;
      }
      await handleSubmit(values, form);
    },
    [activePeriod?.id, handleSubmit, t]
  );

  return (
    <EntityFormModal<CloseBudgetPeriodFormData>
      isOpen={isOpen}
      onClose={handleClose}
      title={t('buttons.closePeriod')}
      description={t('description')}
      schema={schema}
      defaultValues={defaultValues}
      resetValues={defaultValues}
      isLoading={isLoadingPeriod}
      onSubmit={wrappedSubmit}
      footer={(_, isSubmitting) => (
        <ModalFooterActions
          variant="dual"
          cancelLabel={t('buttons.cancel')}
          submitLabel={t('buttons.closePeriod')}
          onCancel={handleClose}
          submitType="submit"
          isSubmitting={isSubmitting}
          submitDisabled={!activePeriod?.id}
        />
      )}
    >
      {(form) => (
        <CloseBudgetPeriodFields
          form={form}
          periodStartDate={periodStartDate}
          salaryHint={t('closePeriodSalaryHint')}
          endDateLabel={t('fields.endDate.label')}
          noActivePeriodAlert={t('noActivePeriodAlert')}
        />
      )}
    </EntityFormModal>
  );
}

export default CloseBudgetPeriodModal;
