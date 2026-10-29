'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';
import { EntityFormModal, formModalStyles, useEntityFormSubmit } from '@/components/form';
import { ModalDateField } from '@/components/form/modal-fields';
import { ModalFooterActions } from '@/components/ui/modal-footer-actions';
import {
  editClosingDateAction,
  editPeriodDatesAction,
  getLatestClosedPeriodAction,
} from '@/features/budgets/actions/budget-period-actions';
import { useRouter } from '@/i18n/routing';
import { todayDateString } from '@/lib/utils/date-utils';
import type { BudgetPeriod } from '@/lib/types';
import { DateTime } from 'luxon';

export type EditClosingDateFormData = {
  start_date: string;
  end_date: string;
};

interface EditClosingDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  period?: Pick<BudgetPeriod, 'id' | 'start_date' | 'end_date'> | null;
  editStart?: boolean;
  editEnd?: boolean;
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
  editStart,
  editEnd,
  startDateLabel,
  endDateLabel,
  noClosedPeriodAlert,
}: Readonly<{
  form: UseFormReturn<EditClosingDateFormData>;
  periodStartDate: string | null;
  editStart: boolean;
  editEnd: boolean;
  startDateLabel: string;
  endDateLabel: string;
  noClosedPeriodAlert: string;
}>) {
  if (!periodStartDate) {
    return <p className="text-sm text-modal-fg-muted">{noClosedPeriodAlert}</p>;
  }

  return (
    <div className={formModalStyles.paddedBodyBleed}>
      {editStart ? (
        <ModalDateField control={form.control} name="start_date" label={startDateLabel} required />
      ) : null}
      {editEnd ? (
        <ModalDateField control={form.control} name="end_date" label={endDateLabel} required />
      ) : null}
    </div>
  );
}

function EditClosingDateModal({
  isOpen,
  onClose,
  userId,
  period,
  editStart = false,
  editEnd = true,
}: Readonly<EditClosingDateModalProps>) {
  const t = useTranslations('Budgets.PeriodManager');
  const locale = useLocale();
  const router = useRouter();
  const today = todayDateString();
  const maxEndDate = DateTime.fromISO(today).minus({ days: 1 }).toISODate() ?? today;
  const usesPeriodDatesAction = editStart;

  const [fetchedPeriod, setFetchedPeriod] = useState<BudgetPeriod | null>(null);
  const [isLoadingFetched, setIsLoadingFetched] = useState(() => !period);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (period) return;

    let cancelled = false;

    getLatestClosedPeriodAction(userId, locale)
      .then((result) => {
        if (cancelled) return;
        setFetchedPeriod(result.data ?? null);
        setIsLoadingFetched(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFetchedPeriod(null);
        setIsLoadingFetched(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, locale, isOpen, period]);

  const closedPeriod = useMemo((): BudgetPeriod | null => {
    if (!period) return fetchedPeriod;
    return {
      id: period.id,
      user_id: userId,
      start_date: period.start_date,
      end_date: period.end_date,
      is_active: false,
      created_at: '',
      updated_at: '',
    };
  }, [period, fetchedPeriod, userId]);
  const isLoadingPeriod = period ? false : isLoadingFetched;

  const periodStartDate = closedPeriod?.start_date
    ? toDateOnlyString(closedPeriod.start_date)
    : null;

  const schema = useMemo(
    () =>
      z
        .object({
          start_date: z.string(),
          end_date: z.string(),
        })
        .superRefine((value, ctx) => {
          if (editStart && !value.start_date) {
            ctx.addIssue({ code: 'custom', path: ['start_date'], message: t('errors.selectDate') });
          }
          if (editEnd && !value.end_date) {
            ctx.addIssue({ code: 'custom', path: ['end_date'], message: t('errors.selectDate') });
          }
          if (editStart && editEnd && value.start_date && value.end_date) {
            if (value.end_date < value.start_date) {
              ctx.addIssue({ code: 'custom', path: ['end_date'], message: t('errors.selectDate') });
            }
          }
          if (editEnd && periodStartDate && value.end_date) {
            const minStart = editStart ? value.start_date || periodStartDate : periodStartDate;
            if (value.end_date < minStart || value.end_date > maxEndDate) {
              ctx.addIssue({ code: 'custom', path: ['end_date'], message: t('errors.selectDate') });
            }
          }
        }),
    [editStart, editEnd, periodStartDate, t, maxEndDate]
  );

  const defaultValues = useMemo((): EditClosingDateFormData => {
    const currentEnd = closedPeriod?.end_date
      ? toDateOnlyString(closedPeriod.end_date)
      : maxEndDate;
    return {
      start_date: periodStartDate ?? '',
      end_date: currentEnd,
    };
  }, [closedPeriod, maxEndDate, periodStartDate]);

  const buildPayload = useCallback(
    (data: EditClosingDateFormData) =>
      usesPeriodDatesAction
        ? {
            ...(editStart ? { startDate: data.start_date } : {}),
            ...(editEnd ? { endDate: data.end_date } : {}),
          }
        : data.end_date,
    [editEnd, editStart, usesPeriodDatesAction]
  );

  const getSuccessToast = useCallback(
    () => ({
      title: usesPeriodDatesAction ? t('buttons.editDates') : t('buttons.editClosingDate'),
      description: usesPeriodDatesAction ? t('editDatesHint') : t('editClosingDateHint'),
    }),
    [t, usesPeriodDatesAction]
  );

  const handleSubmit = useEntityFormSubmit<
    EditClosingDateFormData,
    string | { startDate?: string; endDate?: string },
    BudgetPeriod
  >({
    isEditMode: true,
    editId: closedPeriod?.id,
    onClose: handleClose,
    buildPayload,
    createAction: async () => ({ data: null, error: t('errors.operationFailed') }),
    updateAction: (periodId, payload) =>
      usesPeriodDatesAction
        ? editPeriodDatesAction(
            userId,
            periodId,
            payload as { startDate?: string; endDate?: string },
            locale
          )
        : editClosingDateAction(userId, periodId, payload as string, locale),
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
      title={usesPeriodDatesAction ? t('buttons.editDates') : t('buttons.editClosingDate')}
      description={usesPeriodDatesAction ? t('editDatesHint') : t('editClosingDateHint')}
      schema={schema}
      defaultValues={defaultValues}
      resetValues={defaultValues}
      isLoading={isLoadingPeriod}
      bodyClassName={formModalStyles.paddedBody}
      onSubmit={wrappedSubmit}
      footer={(_, isSubmitting) => (
        <ModalFooterActions
          variant="dual"
          cancelLabel={t('buttons.cancel')}
          submitLabel={
            usesPeriodDatesAction ? t('buttons.saveDates') : t('buttons.saveClosingDate')
          }
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
          editStart={editStart}
          editEnd={editEnd}
          startDateLabel={t('fields.startDate.label')}
          endDateLabel={t('fields.endDate.label')}
          noClosedPeriodAlert={t('noClosedPeriodAlert')}
        />
      )}
    </EntityFormModal>
  );
}

export default EditClosingDateModal;
