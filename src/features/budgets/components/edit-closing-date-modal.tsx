'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';
import { EntityFormModal, useEntityFormSubmit } from '@/components/form';
import { ModalDateField } from '@/components/form/modal-fields';
import { ModalFooterActions } from '@/components/ui/modal-footer-actions';
import {
  editClosingDateAction,
  getLatestClosedPeriodAction,
} from '@/features/budgets/actions/budget-period-actions';
import { useRouter } from '@/i18n/routing';
import { todayDateString } from '@/lib/utils/date-utils';
import type { BudgetPeriod } from '@/lib/types';
import { DateTime } from 'luxon';

export type EditClosingDateFormData = {
  end_date: string;
};

interface EditClosingDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

function toDateOnlyString(date: string | Date): string {
  if (typeof date === 'string') {
    return date.split('T')[0] ?? date;
  }
  return date.toISOString().split('T')[0] ?? '';
}

function EditClosingDateFields({
  form,
  periodStartDate,
  editHint,
  endDateLabel,
  noClosedPeriodAlert,
}: Readonly<{
  form: UseFormReturn<EditClosingDateFormData>;
  periodStartDate: string | null;
  editHint: string;
  endDateLabel: string;
  noClosedPeriodAlert: string;
}>) {
  if (!periodStartDate) {
    return <p className="text-sm text-modal-fg-muted">{noClosedPeriodAlert}</p>;
  }

  return (
    <>
      <p className="text-sm leading-relaxed text-modal-fg-muted">{editHint}</p>
      <ModalDateField control={form.control} name="end_date" label={endDateLabel} required />
    </>
  );
}

function EditClosingDateModal({ isOpen, onClose, userId }: Readonly<EditClosingDateModalProps>) {
  const t = useTranslations('Budgets.PeriodManager');
  const locale = useLocale();
  const router = useRouter();
  const today = todayDateString();
  const maxEndDate = DateTime.fromISO(today).minus({ days: 1 }).toISODate() ?? today;

  const [closedPeriod, setClosedPeriod] = useState<BudgetPeriod | null>(null);
  const [isLoadingPeriod, setIsLoadingPeriod] = useState(true);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;

    getLatestClosedPeriodAction(userId, locale)
      .then((result) => {
        if (cancelled) return;
        setClosedPeriod(result.data ?? null);
        setIsLoadingPeriod(false);
      })
      .catch(() => {
        if (cancelled) return;
        setClosedPeriod(null);
        setIsLoadingPeriod(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, locale, isOpen]);

  const periodStartDate = closedPeriod?.start_date
    ? toDateOnlyString(closedPeriod.start_date)
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
              return value >= periodStartDate && value <= maxEndDate;
            },
            { message: t('errors.selectDate') }
          ),
      }),
    [periodStartDate, t, maxEndDate]
  );

  const defaultValues = useMemo((): EditClosingDateFormData => {
    const currentEnd = closedPeriod?.end_date
      ? toDateOnlyString(closedPeriod.end_date)
      : maxEndDate;
    return { end_date: currentEnd };
  }, [closedPeriod, maxEndDate]);

  const buildPayload = useCallback((data: EditClosingDateFormData) => data.end_date, []);

  const getSuccessToast = useCallback(
    () => ({
      title: t('buttons.editClosingDate'),
      description: t('editClosingDateHint'),
    }),
    [t]
  );

  const handleSubmit = useEntityFormSubmit<EditClosingDateFormData, string, BudgetPeriod>({
    isEditMode: true,
    editId: closedPeriod?.id,
    onClose: handleClose,
    buildPayload,
    createAction: async () => ({ data: null, error: t('errors.operationFailed') }),
    updateAction: (periodId, endDate) => editClosingDateAction(userId, periodId, endDate, locale),
    getSuccessToast,
    errorToast: { title: t('errors.operationFailed') },
    refreshAfterSuccess: () => router.refresh(),
    unknownErrorMessage: t('errors.unknown'),
  });

  const wrappedSubmit = useCallback(
    async (values: EditClosingDateFormData, form: UseFormReturn<EditClosingDateFormData>) => {
      if (!closedPeriod?.id) {
        form.setError('root', { message: t('noClosedPeriodAlert') });
        return;
      }
      await handleSubmit(values, form);
    },
    [closedPeriod?.id, handleSubmit, t]
  );

  return (
    <EntityFormModal<EditClosingDateFormData>
      isOpen={isOpen}
      onClose={handleClose}
      title={t('buttons.editClosingDate')}
      description={t('editClosingDateHint')}
      schema={schema}
      defaultValues={defaultValues}
      resetValues={defaultValues}
      isLoading={isLoadingPeriod}
      onSubmit={wrappedSubmit}
      footer={(_, isSubmitting) => (
        <ModalFooterActions
          variant="dual"
          cancelLabel={t('buttons.cancel')}
          submitLabel={t('buttons.saveClosingDate')}
          onCancel={handleClose}
          submitType="submit"
          isSubmitting={isSubmitting}
          submitDisabled={!closedPeriod?.id}
        />
      )}
    >
      {(form) => (
        <EditClosingDateFields
          form={form}
          periodStartDate={periodStartDate}
          editHint={t('editClosingDateHint')}
          endDateLabel={t('fields.endDate.label')}
          noClosedPeriodAlert={t('noClosedPeriodAlert')}
        />
      )}
    </EntityFormModal>
  );
}

export default EditClosingDateModal;
