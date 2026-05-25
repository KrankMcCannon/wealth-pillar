'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Pause, Play } from 'lucide-react';

import {
  EntityFormModal,
  EntityFormFooter,
  formModalStyles,
  useEntityFormPermissions,
  useEntityFormRowReset,
  useEntityFormSubmit,
} from '@/components/form';
import { RecurringTransactionSeries, TransactionFrequencyType } from '@/lib/types';
import {
  createRecurringSeriesAction,
  deleteRecurringSeriesAction,
  getRecurringSeriesByIdAction,
  toggleRecurringSeriesActiveAction,
  updateRecurringSeriesAction,
} from '@/features/recurring';
import { todayDateString } from '@/lib/utils/date-utils';
import { useAccounts, useCategories } from '@/stores/reference-data-store';
import { useRouter } from '@/i18n/routing';
import { toast } from '@/hooks/use-toast';

import { RecurrencePicker } from './recurrence-picker';
import { calculateDefaultAccountId, formatDateForInput } from './recurring-form-helpers';
import { RecurringDescriptionField, RecurringFormFields } from './recurring-form-fields';
import {
  createRecurringSchema,
  type RecurringFormData,
  type RecurringTransactionSeriesData,
} from './recurring-form-schema';
import { RecurringPreview } from './recurring-preview';

interface RecurringFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

const s = formModalStyles;

function mapSeriesToFormData(series: RecurringTransactionSeries): RecurringFormData {
  return {
    description: series.description,
    amount: series.amount.toString(),
    type: series.type === 'transfer' ? 'expense' : series.type,
    category: series.category,
    frequency: series.frequency,
    user_ids: series.user_ids,
    account_id: series.account_id,
    start_date: formatDateForInput(series.start_date),
    end_date: formatDateForInput(series.end_date),
    due_day: series.due_day.toString(),
  };
}

function buildRecurringPayload(
  data: RecurringFormData,
  groupId: string
): RecurringTransactionSeriesData {
  return {
    description: data.description.trim(),
    amount: Number.parseFloat(data.amount),
    type: data.type,
    category: data.category,
    frequency: data.frequency as TransactionFrequencyType,
    account_id: data.account_id,
    start_date: data.start_date,
    end_date: data.end_date || null,
    due_day: Number.parseInt(data.due_day, 10),
    user_ids: data.user_ids,
    group_id: groupId,
  };
}

function RecurringFormModalBody({
  form,
  isEditMode,
  isOpen,
  categories,
  groupUsers,
  currentUser,
  t,
}: Readonly<{
  form: UseFormReturn<RecurringFormData>;
  isEditMode: boolean;
  isOpen: boolean;
  categories: ReturnType<typeof useCategories>;
  groupUsers: ReturnType<typeof useEntityFormPermissions>['groupUsers'];
  currentUser: ReturnType<typeof useEntityFormPermissions>['currentUser'];
  t: ReturnType<typeof useTranslations>;
}>) {
  const accounts = useAccounts();
  const { control, setValue, formState } = form;
  const { isSubmitting } = formState;

  const watchedUserIds = useWatch({ control, name: 'user_ids' });
  const watchedAccountId = useWatch({ control, name: 'account_id' });
  const filteredAccounts = useMemo(() => {
    if (!watchedUserIds || watchedUserIds.length === 0) return accounts;

    const filtered = accounts.filter((acc) =>
      watchedUserIds.every((userId: string) => acc.user_ids.includes(userId))
    );

    return filtered.sort((a, b) => {
      const aHasCurrentUser = a.user_ids.includes(currentUser.id);
      const bHasCurrentUser = b.user_ids.includes(currentUser.id);
      if (aHasCurrentUser && !bHasCurrentUser) return -1;
      if (!aHasCurrentUser && bHasCurrentUser) return 1;
      return 0;
    });
  }, [accounts, watchedUserIds, currentUser.id]);

  const defaultAccountId = useMemo(() => {
    return calculateDefaultAccountId(
      watchedUserIds,
      filteredAccounts,
      accounts,
      currentUser,
      groupUsers
    );
  }, [watchedUserIds, filteredAccounts, accounts, currentUser, groupUsers]);

  useEffect(() => {
    if (!isOpen || !defaultAccountId) return;

    if (!isEditMode && defaultAccountId !== watchedAccountId) {
      setValue('account_id', defaultAccountId);
    }
  }, [isOpen, watchedUserIds, defaultAccountId, watchedAccountId, setValue, isEditMode]);

  return (
    <>
      <RecurringPreview form={form} t={t} isSubmitting={isSubmitting} />

      <div className={s.fieldStack}>
        <RecurringFormFields
          form={form}
          categories={categories}
          filteredAccounts={filteredAccounts}
          groupUsers={groupUsers}
          currentUserId={currentUser.id}
          t={t}
          isSubmitting={isSubmitting}
        />

        <RecurrencePicker form={form} t={t} isSubmitting={isSubmitting} />

        <RecurringDescriptionField form={form} t={t} isSubmitting={isSubmitting} />
      </div>
    </>
  );
}

function RecurringFormModal({ isOpen, onClose, editId }: Readonly<RecurringFormModalProps>) {
  const t = useTranslations('Recurring.FormModal');
  const tSeriesCard = useTranslations('Recurring.SeriesCard');
  const tDialogs = useTranslations('TransactionsContent.dialogs');

  const { currentUser, groupUsers, groupId, selectedUserId } = useEntityFormPermissions();
  const categories = useCategories();
  const router = useRouter();
  const [seriesIsActive, setSeriesIsActive] = useState<boolean | undefined>(undefined);

  const isEditMode = Boolean(editId);
  const title = isEditMode ? t('title.edit') : t('title.create');
  const recurringSchema = useMemo(() => createRecurringSchema(t), [t]);
  const today = todayDateString();

  const createDefaults = useMemo(
    (): RecurringFormData => ({
      description: '',
      amount: '',
      type: 'expense',
      category: '',
      frequency: 'monthly',
      user_ids: selectedUserId ? [selectedUserId] : [currentUser.id],
      account_id: '',
      start_date: today,
      end_date: '',
      due_day: '1',
    }),
    [selectedUserId, currentUser.id, today]
  );

  const loadEditValues = useCallback(async (id: string, signal: AbortSignal) => {
    const result = await getRecurringSeriesByIdAction(id);
    if (signal.aborted) return null;
    if (!result.data) {
      setSeriesIsActive(undefined);
      return null;
    }
    setSeriesIsActive(result.data.is_active);
    return mapSeriesToFormData(result.data);
  }, []);

  const { resetValues, isReady, isLoading } = useEntityFormRowReset({
    editId,
    createValues: createDefaults,
    loadEditValues,
  });

  const buildPayload = useCallback(
    (data: RecurringFormData) => buildRecurringPayload(data, groupId),
    [groupId]
  );

  const getSuccessToast = useCallback(
    (edit: boolean) =>
      edit
        ? { title: t('toast.updatedTitle'), description: t('toast.updatedDescription') }
        : { title: t('toast.createdTitle'), description: t('toast.createdDescription') },
    [t]
  );

  const handleSubmit = useEntityFormSubmit<
    RecurringFormData,
    RecurringTransactionSeriesData,
    RecurringTransactionSeries
  >({
    isEditMode,
    editId,
    onClose,
    buildPayload,
    createAction: (payload) => createRecurringSeriesAction(payload),
    updateAction: (id, payload) => updateRecurringSeriesAction({ id, ...payload }),
    getSuccessToast,
    errorToast: { title: t('toast.errorTitle') },
    refreshAfterSuccess: () => router.refresh(),
    unknownErrorMessage: t('errors.unknown'),
  });

  const handleToggleSeriesActive = useCallback(async () => {
    if (!editId || seriesIsActive === undefined) return;
    const nextActive = !seriesIsActive;
    const result = await toggleRecurringSeriesActiveAction(editId, nextActive);
    if (result.error) {
      toast({ title: t('toast.errorTitle'), description: result.error, variant: 'destructive' });
      return;
    }
    setSeriesIsActive(nextActive);
    toast({
      title: nextActive ? tSeriesCard('actions.resume') : tSeriesCard('actions.pause'),
      description: t('toast.updatedDescription'),
      variant: 'success',
    });
    router.refresh();
  }, [editId, seriesIsActive, router, t, tSeriesCard]);

  const handleDeleteSeries = useCallback(async () => {
    if (!editId) return;
    const result = await deleteRecurringSeriesAction(editId);
    if (result.error) {
      toast({ title: t('toast.errorTitle'), description: result.error, variant: 'destructive' });
      throw new Error(result.error);
    }
    toast({
      title: tSeriesCard('actions.delete'),
      description: t('toast.updatedDescription'),
      variant: 'success',
    });
    router.refresh();
  }, [editId, router, t, tSeriesCard]);

  const deleteDialogDescription =
    resetValues?.description.trim() || tDialogs('deleteRecurring.fallbackDescription');

  const pauseResumeLabel =
    seriesIsActive === false ? tSeriesCard('actions.resume') : tSeriesCard('actions.pause');

  return (
    <EntityFormModal<RecurringFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      schema={recurringSchema}
      defaultValues={createDefaults}
      resetValues={resetValues ?? createDefaults}
      isLoading={Boolean(editId) && (isLoading || !isReady)}
      {...(isEditMode && editId
        ? {
            deletion: {
              enabled: true,
              title: tDialogs('deleteRecurring.title'),
              message: tDialogs('deleteRecurring.message', {
                description: deleteDialogDescription,
              }),
              confirmText: tDialogs('deleteRecurring.confirm'),
              cancelText: tDialogs('cancel'),
              onDelete: handleDeleteSeries,
            },
          }
        : {})}
      onSubmit={handleSubmit}
      footer={(_, isSubmitting, { openDeleteDialog }) => (
        <EntityFormFooter
          isEditMode={Boolean(isEditMode && editId)}
          isSubmitting={isSubmitting}
          submitLabel={isEditMode ? t('buttons.saveChanges') : t('buttons.createSeries')}
          showSubmitIcon={false}
          secondaryAction={
            isEditMode && editId ? (
              <button
                type="button"
                onClick={handleToggleSeriesActive}
                disabled={isSubmitting}
                className={s.footer.secondaryAction}
              >
                {seriesIsActive === false ? (
                  <Play className="h-5 w-5 shrink-0" aria-hidden />
                ) : (
                  <Pause className="h-5 w-5 shrink-0" aria-hidden />
                )}
                {pauseResumeLabel}
              </button>
            ) : undefined
          }
          {...(isEditMode && editId && openDeleteDialog
            ? {
                deleteLabel: tSeriesCard('actions.delete'),
                onDelete: openDeleteDialog,
              }
            : {})}
        />
      )}
    >
      {(form) => (
        <RecurringFormModalBody
          form={form}
          isEditMode={isEditMode}
          isOpen={isOpen}
          categories={categories}
          groupUsers={groupUsers}
          currentUser={currentUser}
          t={t}
        />
      )}
    </EntityFormModal>
  );
}

export default RecurringFormModal;
