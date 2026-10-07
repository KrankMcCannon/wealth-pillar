'use client';

import { useCallback, useMemo } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { EntityFormModal, formModalStyles, useEntityFormSubmit } from '@/components/form';
import { ModalDateField } from '@/components/form/modal-fields';
import { ModalFooterActions } from '@/components/ui/modal-footer-actions';
import { startPeriodAction } from '@/features/budgets';
import { useRouter } from '@/i18n/routing';
import { todayDateString } from '@/lib/utils/date-utils';
import type { BudgetPeriod } from '@/lib/types';

export type StartSalaryPeriodFormData = {
  salary_date: string;
};

interface StartSalaryPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  periodStart: string | null;
  onSuccess?: () => void;
}

function StartSalaryPeriodModal({
  isOpen,
  onClose,
  userId,
  periodStart,
  onSuccess,
}: Readonly<StartSalaryPeriodModalProps>) {
  const t = useTranslations('Budgets.SalaryPeriod');
  const locale = useLocale();
  const router = useRouter();
  const today = todayDateString();

  const schema = useMemo(
    () =>
      z.object({
        salary_date: z
          .string()
          .min(1, t('errors.dateRequired'))
          .refine((value) => value <= today, {
            message: t('errors.futureDate'),
          })
          .refine((value) => !periodStart || value > periodStart, {
            message: t('errors.afterCurrentStart'),
          }),
      }),
    [periodStart, t, today]
  );

  const defaultValues = useMemo(
    (): StartSalaryPeriodFormData => ({
      salary_date: today,
    }),
    [today]
  );

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSuccess = useCallback(() => {
    onSuccess?.();
    router.refresh();
  }, [onSuccess, router]);

  const handleSubmit = useEntityFormSubmit<StartSalaryPeriodFormData, string, BudgetPeriod>({
    isEditMode: false,
    onClose: handleClose,
    buildPayload: (data) => data.salary_date,
    createAction: (salaryDate) => startPeriodAction(userId, salaryDate, locale),
    updateAction: async () => ({
      data: null,
      error: t('errors.operationFailed'),
    }),
    getSuccessToast: () => ({
      title: t('successTitle'),
      description: t('successDescription'),
    }),
    errorToast: {
      title: t('errors.operationFailed'),
    },
    refreshAfterSuccess: handleSuccess,
    unknownErrorMessage: t('errors.unknown'),
  });

  const onSubmit = useCallback(
    async (values: StartSalaryPeriodFormData, form: UseFormReturn<StartSalaryPeriodFormData>) => {
      await handleSubmit(values, form);
    },
    [handleSubmit]
  );

  return (
    <EntityFormModal<StartSalaryPeriodFormData>
      isOpen={isOpen}
      onClose={handleClose}
      title={t('title')}
      description={t('description')}
      schema={schema}
      defaultValues={defaultValues}
      resetValues={defaultValues}
      bodyClassName={formModalStyles.paddedBody}
      onSubmit={onSubmit}
      footer={(_, isSubmitting) => (
        <ModalFooterActions
          variant="dual"
          cancelLabel={t('cancel')}
          submitLabel={t('submit')}
          onCancel={handleClose}
          submitType="submit"
          isSubmitting={isSubmitting}
        />
      )}
    >
      {(form) => (
        <>
          <p className="text-sm leading-relaxed text-modal-fg-muted">{t('hint')}</p>

          <div className={formModalStyles.paddedBodyBleed}>
            <ModalDateField
              control={form.control}
              name="salary_date"
              label={t('dateLabel')}
              required
            />
          </div>
        </>
      )}
    </EntityFormModal>
  );
}

export default StartSalaryPeriodModal;
