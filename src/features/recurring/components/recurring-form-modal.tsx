'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Pause, Play, Trash2 } from 'lucide-react';

import { EntityFormModal, ModalRootError } from '@/components/form';
import { RecurringTransactionSeries, TransactionFrequencyType } from '@/lib/types';
import {
  createRecurringSeriesAction,
  deleteRecurringSeriesAction,
  getRecurringSeriesByIdAction,
  toggleRecurringSeriesActiveAction,
  updateRecurringSeriesAction,
} from '@/features/recurring';
import { todayDateString } from '@/lib/utils/date-utils';
import { useRequiredCurrentUser, useRequiredGroupUsers, useRequiredGroupId } from '@/hooks';
import { useAccounts, useCategories } from '@/stores/reference-data-store';
import { useUserFilter } from '@/hooks/state/use-user-filter';
import { useRouter } from '@/i18n/routing';
import { toast } from '@/hooks/use-toast';
import { stitchTransactionFormModal } from '@/styles/home-design-foundation';

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

const s = stitchTransactionFormModal;

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
  groupUsers: ReturnType<typeof useRequiredGroupUsers>;
  currentUser: ReturnType<typeof useRequiredCurrentUser>;
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
      {formState.errors.root?.message ? (
        <ModalRootError message={formState.errors.root.message} />
      ) : null}

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
  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();
  const categories = useCategories();
  const groupId = useRequiredGroupId();
  const { selectedUserId } = useUserFilter();
  const router = useRouter();
  const [loadedSeries, setLoadedSeries] = useState<{
    editId: string;
    data: RecurringTransactionSeries | null;
  } | null>(null);

  const isEditMode = !!editId;
  const editingSeries =
    isOpen && editId && loadedSeries?.editId === editId ? loadedSeries.data : null;
  const title = isEditMode ? t('title.edit') : t('title.create');
  const recurringSchema = useMemo(() => createRecurringSchema(t), [t]);
  const today = todayDateString();

  useEffect(() => {
    if (!isOpen || !editId) return;
    let cancelled = false;
    (async () => {
      const result = await getRecurringSeriesByIdAction(editId);
      if (!cancelled) {
        setLoadedSeries({ editId, data: result.data ?? null });
      }
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isOpen, editId]);

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

  const resetValues = useMemo((): RecurringFormData => {
    if (isEditMode && editingSeries) {
      return {
        description: editingSeries.description,
        amount: editingSeries.amount.toString(),
        type: editingSeries.type === 'transfer' ? 'expense' : editingSeries.type,
        category: editingSeries.category,
        frequency: editingSeries.frequency,
        user_ids: editingSeries.user_ids,
        account_id: editingSeries.account_id,
        start_date: formatDateForInput(editingSeries.start_date),
        end_date: formatDateForInput(editingSeries.end_date),
        due_day: editingSeries.due_day.toString(),
      };
    }
    return createDefaults;
  }, [isEditMode, editingSeries, createDefaults]);

  const handleUpdate = async (seriesData: RecurringTransactionSeriesData) => {
    if (!editId) return;

    const result = await updateRecurringSeriesAction({
      id: editId,
      ...seriesData,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    toast({
      title: t('toast.updatedTitle'),
      description: t('toast.updatedDescription'),
      variant: 'success',
    });
    router.refresh();
  };

  const handleCreate = async (seriesData: RecurringTransactionSeriesData) => {
    onClose();

    const result = await createRecurringSeriesAction(seriesData);

    if (result.error) {
      toast({ title: t('toast.errorTitle'), description: result.error, variant: 'destructive' });
      return;
    }

    toast({
      title: t('toast.createdTitle'),
      description: t('toast.createdDescription'),
      variant: 'success',
    });
    router.refresh();
  };

  const handleToggleSeriesActive = useCallback(async () => {
    if (!editId || !editingSeries) return;
    const nextActive = !editingSeries.is_active;
    const result = await toggleRecurringSeriesActiveAction(editId, nextActive);
    if (result.error) {
      toast({ title: t('toast.errorTitle'), description: result.error, variant: 'destructive' });
      return;
    }
    toast({
      title: nextActive ? tSeriesCard('actions.resume') : tSeriesCard('actions.pause'),
      description: t('toast.updatedDescription'),
      variant: 'success',
    });
    router.refresh();
  }, [editId, editingSeries, router, t, tSeriesCard]);

  const handleDeleteSeries = useCallback(async () => {
    if (!editId) return;
    onClose();
    const result = await deleteRecurringSeriesAction(editId);
    if (result.error) {
      toast({ title: t('toast.errorTitle'), description: result.error, variant: 'destructive' });
      return;
    }
    toast({
      title: tSeriesCard('actions.delete'),
      description: t('toast.updatedDescription'),
      variant: 'success',
    });
    router.refresh();
  }, [editId, onClose, router, t, tSeriesCard]);

  const pauseResumeLabel =
    editingSeries?.is_active === false
      ? tSeriesCard('actions.resume')
      : tSeriesCard('actions.pause');

  return (
    <EntityFormModal<RecurringFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      schema={recurringSchema}
      defaultValues={createDefaults}
      resetValues={resetValues}
      repositionInputs={false}
      formClassName={s.formColumn}
      bodyClassName={s.scrollBody}
      footerClassName={s.stickyFooter}
      onSubmit={async (data, form) => {
        try {
          const amount = Number.parseFloat(data.amount);
          const dueDay = Number.parseInt(data.due_day, 10);

          const seriesData = {
            description: data.description.trim(),
            amount,
            type: data.type,
            category: data.category,
            frequency: data.frequency as TransactionFrequencyType,
            account_id: data.account_id,
            start_date: data.start_date,
            end_date: data.end_date || null,
            due_day: dueDay,
            user_ids: data.user_ids,
            group_id: groupId,
          };

          if (isEditMode && editId) {
            await handleUpdate(seriesData);
            onClose();
          } else {
            await handleCreate(seriesData);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : t('errors.unknown');
          form.setError('root', { message });
          toast({ title: t('toast.errorTitle'), description: message, variant: 'destructive' });
        }
      }}
      footer={(_, isSubmitting) => (
        <div className={s.footerActionsStack}>
          <button type="submit" disabled={isSubmitting} className={s.primaryCta}>
            {isEditMode ? t('buttons.saveChanges') : t('buttons.createSeries')}
          </button>
          {isEditMode && editId ? (
            <button
              type="button"
              onClick={handleToggleSeriesActive}
              disabled={isSubmitting}
              className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl border border-[#4d6fd0]/35 bg-[#11295f]/85 px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#e6ecff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-colors hover:bg-[#17336f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b9fff]/35 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 motion-reduce:active:scale-100"
            >
              {editingSeries?.is_active === false ? (
                <Play className="h-5 w-5 shrink-0" aria-hidden />
              ) : (
                <Pause className="h-5 w-5 shrink-0" aria-hidden />
              )}
              {pauseResumeLabel}
            </button>
          ) : null}
          {isEditMode && editId ? (
            <button
              type="button"
              onClick={handleDeleteSeries}
              disabled={isSubmitting}
              className={s.deleteButton}
            >
              <Trash2 className="h-5 w-5 shrink-0" aria-hidden />
              {tSeriesCard('actions.delete')}
            </button>
          ) : null}
        </div>
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
