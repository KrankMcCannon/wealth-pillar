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
import { useWatch } from 'react-hook-form';
import { DateTime } from 'luxon';
import { todayDateString } from '@/lib/utils/date-utils';
import type { BudgetPeriod } from '@/lib/types';

export type StartSalaryPeriodFormData = {
  salary_date: string;
};

interface StartSalaryPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  periodStart: string | null;
  onSuccess?: () => void;
}

function CyclePreview({
  form,
  name,
  start,
}: {
  form: UseFormReturn<StartSalaryPeriodFormData>;
  name: string;
  start: string | null;
}) {
  const date = useWatch({ control: form.control, name: 'salary_date' });
  const t = useTranslations('Budgets.UX');
  const locale = useLocale();
  const format = (value: string) => {
    const parsed = DateTime.fromISO(value);
    return parsed.isValid ? parsed.setLocale(locale).toLocaleString(DateTime.DATE_MED) : '—';
  };
  return (
    <div role="status" className="space-y-3 border-t border-border/40 pt-3 text-sm">
      {name ? <p className="font-medium">{name}</p> : null}
      <dl className="space-y-2">
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
          <dt className="text-muted-foreground">{t('previousPeriod')}</dt>
          <dd className="tabular-nums">
            {start ? format(start) : '—'} –{' '}
            {format(DateTime.fromISO(date).minus({ days: 1 }).toISODate() ?? date)}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
          <dt className="text-muted-foreground">{t('nextPeriod')}</dt>
          <dd className="font-medium tabular-nums">{format(date)}</dd>
        </div>
      </dl>
      {date < todayDateString() ? <p>{t('retro')}</p> : null}
    </div>
  );
}
function StartSalaryPeriodModal({
  isOpen,
  onClose,
  userId,
  userName = '',
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
          <div className={formModalStyles.paddedBodyBleed}>
            <ModalDateField
              control={form.control}
              name="salary_date"
              label={t('dateLabel')}
              required
            />
          </div>
          <CyclePreview form={form} name={userName} start={periodStart} />
        </>
      )}
    </EntityFormModal>
  );
}

export default StartSalaryPeriodModal;
