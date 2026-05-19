'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Pause, Play, Trash2 } from 'lucide-react';

import { ModalWrapper } from '@/components/ui/modal-wrapper';
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

function RecurringFormModal({ isOpen, onClose, editId }: Readonly<RecurringFormModalProps>) {
  const t = useTranslations('Recurring.FormModal');
  const tSeriesCard = useTranslations('Recurring.SeriesCard');
  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();
  const accounts = useAccounts();
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

  const today = todayDateString();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RecurringFormData>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
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
    },
  });

  const watchedType = useWatch({ control, name: 'type' });
  const watchedFrequency = useWatch({ control, name: 'frequency' });
  const watchedUserIds = useWatch({ control, name: 'user_ids' });
  const watchedAccountId = useWatch({ control, name: 'account_id' });
  const watchedCategory = useWatch({ control, name: 'category' });
  const watchedStartDate = useWatch({ control, name: 'start_date' });
  const watchedEndDate = useWatch({ control, name: 'end_date' });

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
    if (isOpen && isEditMode && editingSeries) {
      const startDateStr = formatDateForInput(editingSeries.start_date);
      const endDateStr = formatDateForInput(editingSeries.end_date);

      reset({
        description: editingSeries.description,
        amount: editingSeries.amount.toString(),
        type: editingSeries.type === 'transfer' ? 'expense' : editingSeries.type,
        category: editingSeries.category,
        frequency: editingSeries.frequency,
        user_ids: editingSeries.user_ids,
        account_id: editingSeries.account_id,
        start_date: startDateStr,
        end_date: endDateStr,
        due_day: editingSeries.due_day.toString(),
      });
    } else if (isOpen && !isEditMode) {
      reset({
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
      });
    }
  }, [isOpen, isEditMode, editId, selectedUserId, currentUser.id, reset, today, editingSeries]);

  useEffect(() => {
    if (!isOpen || !defaultAccountId) return;

    if (!isEditMode && defaultAccountId !== watchedAccountId) {
      setValue('account_id', defaultAccountId);
    }
  }, [isOpen, watchedUserIds, defaultAccountId, watchedAccountId, setValue, isEditMode]);

  const handleUpdate = async (seriesData: RecurringTransactionSeriesData) => {
    if (!editId) return;

    const result = await updateRecurringSeriesAction({
      id: editId,
      ...seriesData,
    });

    if (result.error) {
      setError('root', { message: result.error });
      toast({ title: t('toast.errorTitle'), description: result.error, variant: 'destructive' });
      return;
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

  const onSubmit = async (data: RecurringFormData) => {
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
      } else {
        await handleCreate(seriesData);
      }

      if (isEditMode) {
        onClose();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.unknown');
      setError('root', { message });
      toast({ title: t('toast.errorTitle'), description: message, variant: 'destructive' });
    }
  };

  const handleToggleSeriesActive = async () => {
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
  };

  const handleDeleteSeries = async () => {
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
  };
  const s = stitchTransactionFormModal;
  const pauseResumeLabel =
    editingSeries?.is_active === false
      ? tSeriesCard('actions.resume')
      : tSeriesCard('actions.pause');

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onClose}
      title={title}
      titleClassName={s.headerTitle}
      maxWidth="md"
      repositionInputs={false}
      handleClassName={s.handle}
      drawerHeaderClassName={s.drawerHeaderShell}
      drawerCloseClassName={s.headerClose}
      showCloseButton
      className={s.drawerSurface}
    >
      <form onSubmit={handleSubmit(onSubmit)} className={s.formColumn}>
        <div className={s.scrollBody}>
          {errors.root ? (
            <div className={s.errorBanner} role="alert">
              {errors.root.message}
            </div>
          ) : null}

          <RecurringPreview
            control={control}
            errors={errors}
            t={t}
            s={s}
            isSubmitting={isSubmitting}
          />

          <div className={s.fieldStack}>
            <RecurringFormFields
              watchedCategory={watchedCategory}
              watchedAccountId={watchedAccountId}
              watchedStartDate={watchedStartDate}
              watchedEndDate={watchedEndDate}
              watchedUserIds={watchedUserIds}
              setValue={setValue}
              errors={errors}
              categories={categories}
              filteredAccounts={filteredAccounts}
              groupUsers={groupUsers}
              currentUserId={currentUser.id}
              t={t}
              s={s}
            />

            <RecurrencePicker
              watchedType={watchedType}
              watchedFrequency={watchedFrequency}
              setValue={setValue}
              register={register}
              errors={errors}
              t={t}
              s={s}
              isSubmitting={isSubmitting}
            />

            <RecurringDescriptionField
              register={register}
              errors={errors}
              t={t}
              s={s}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>

        <div className={s.stickyFooter}>
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
        </div>
      </form>
    </ModalWrapper>
  );
}

export default RecurringFormModal;
