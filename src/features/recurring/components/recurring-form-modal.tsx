'use client';

import { cn } from '@/lib/utils';
import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { ArrowLeftRight, CalendarClock, Pause, Play, Trash2 } from 'lucide-react';
import { RecurringTransactionSeries, TransactionFrequencyType } from '@/lib/types';
import { getTempId } from '@/lib/utils/temp-id';
import { ModalWrapper } from '@/components/ui/modal-wrapper';
import { FormCurrencyInput, FormSelect, MultiUserSelect } from '@/components/form';
import { AccountField, CategoryField, DateField, Input } from '@/components/ui';
import {
  createRecurringSeriesAction,
  deleteRecurringSeriesAction,
  toggleRecurringSeriesActiveAction,
  updateRecurringSeriesAction,
} from '@/features/recurring';
import { todayDateString } from '@/lib/utils/date-utils';
import { useRequiredCurrentUser, useRequiredGroupUsers, useRequiredGroupId } from '@/hooks';
import { useAccounts, useCategories } from '@/stores/reference-data-store';
import { useUserFilterStore } from '@/stores/user-filter-store';
import { usePageDataStore } from '@/stores/page-data-store';
import { toast } from '@/hooks/use-toast';
import { stitchTransactionFormModal } from '@/styles/home-design-foundation';

// Helper: Format date for input
const formatDateForInput = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  if (typeof date === 'string') return date.split('T')[0] ?? '';
  return date.toISOString().split('T')[0] ?? '';
};

// Helper: Calculate default account
const calculateDefaultAccountId = (
  watchedUserIds: string[] | undefined,
  filteredAccounts: AccountFieldProp[],
  accounts: AccountFieldProp[],
  currentUser: { id: string },
  groupUsers: { id: string; default_account_id?: string | null }[]
): string => {
  if (!watchedUserIds || watchedUserIds.length === 0 || filteredAccounts.length === 0) {
    return '';
  }

  // ONLY 1 USER: Use their default account
  if (watchedUserIds.length === 1) {
    const selectedUser = groupUsers.find((u) => u.id === watchedUserIds[0]);

    if (selectedUser?.default_account_id) {
      const defaultAcc = filteredAccounts.find((acc) => acc.id === selectedUser.default_account_id);
      if (defaultAcc) {
        return defaultAcc.id;
      }
    }

    // Fallback: first available account for that user
    return filteredAccounts[0]?.id ?? '';
  }

  // Multiple users: first shared account
  if (filteredAccounts.length > 0) {
    return filteredAccounts[0]?.id ?? '';
  }

  // Fallback: creator's default
  const creator = groupUsers.find((u) => u.id === currentUser.id);
  if (creator?.default_account_id) {
    const creatorDefaultAcc = accounts.find((acc) => acc.id === creator.default_account_id);
    if (creatorDefaultAcc) {
      return creatorDefaultAcc.id;
    }
  }

  // Last fallback: first available account
  return accounts.length > 0 ? (accounts[0]?.id ?? '') : '';
};

// Helper interface
interface AccountFieldProp {
  id: string;
  user_ids: string[];
}

const createRecurringSchema = (t: ReturnType<typeof useTranslations>) =>
  z
    .object({
      description: z.string().min(1, t('validation.descriptionRequired')).trim(),
      amount: z
        .string()
        .min(1, t('validation.amountRequired'))
        .refine((val) => !Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) > 0, {
          message: t('validation.amountGreaterThanZero'),
        }),
      type: z.enum(['income', 'expense']),
      category: z.string().min(1, t('validation.categoryRequired')),
      frequency: z.enum(['once', 'weekly', 'biweekly', 'monthly', 'yearly']),
      user_ids: z.array(z.string()).min(1, t('validation.userIdsRequired')),
      account_id: z.string().min(1, t('validation.accountRequired')),
      start_date: z.string().min(1, t('validation.startDateRequired')),
      end_date: z.string().optional(),
      due_day: z
        .string()
        .min(1, t('validation.dueDayRequired'))
        .refine(
          (val) => {
            const num = Number.parseInt(val, 10);
            return !Number.isNaN(num) && num >= 1 && num <= 31;
          },
          {
            message: t('validation.dueDayRange'),
          }
        ),
    })
    .refine(
      (data) => {
        if (data.end_date && data.start_date) {
          return new Date(data.end_date) > new Date(data.start_date);
        }
        return true;
      },
      {
        message: t('validation.endDateAfterStart'),
        path: ['end_date'],
      }
    );

type RecurringFormData = z.infer<ReturnType<typeof createRecurringSchema>>;

interface RecurringTransactionSeriesData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  frequency: TransactionFrequencyType;
  account_id: string;
  start_date: string;
  end_date: string | null;
  due_day: number;
  user_ids: string[];
  group_id: string;
}

interface RecurringFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

function RecurringFormModal({ isOpen, onClose, editId }: Readonly<RecurringFormModalProps>) {
  const t = useTranslations('Recurring.FormModal');
  const tSeriesCard = useTranslations('Recurring.SeriesCard');
  // Read from stores instead of props
  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();
  const accounts = useAccounts();
  const categories = useCategories();
  const groupId = useRequiredGroupId();
  const selectedUserId = useUserFilterStore((state) => state.selectedUserId);

  // Page data store actions for optimistic updates
  const storeRecurringSeries = usePageDataStore((state) => state.recurringSeries);
  const addRecurringSeries = usePageDataStore((state) => state.addRecurringSeries);
  const updateRecurringSeries = usePageDataStore((state) => state.updateRecurringSeries);
  const removeRecurringSeries = usePageDataStore((state) => state.removeRecurringSeries);

  const isEditMode = !!editId;
  const title = isEditMode ? t('title.edit') : t('title.create');
  const recurringSchema = useMemo(() => createRecurringSchema(t), [t]);
  const editingSeries = useMemo(
    () => (editId ? (storeRecurringSeries.find((s) => s.id === editId) ?? null) : null),
    [editId, storeRecurringSeries]
  );

  const today = todayDateString();

  // React Hook Form setup
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

  // Filter accounts: show accounts accessible by ALL selected users (intersection)
  const filteredAccounts = useMemo(() => {
    if (!watchedUserIds || watchedUserIds.length === 0) return accounts;

    // Filter: accounts accessible by ALL selected users
    const filtered = accounts.filter((acc) =>
      watchedUserIds.every((userId) => acc.user_ids.includes(userId))
    );

    // Sort: currentUser's accounts first
    return filtered.sort((a, b) => {
      const aHasCurrentUser = a.user_ids.includes(currentUser.id);
      const bHasCurrentUser = b.user_ids.includes(currentUser.id);
      if (aHasCurrentUser && !bHasCurrentUser) return -1;
      if (!aHasCurrentUser && bHasCurrentUser) return 1;
      return 0;
    });
  }, [accounts, watchedUserIds, currentUser.id]);

  // Calculate default account to prepopulate
  const defaultAccountId = useMemo(() => {
    return calculateDefaultAccountId(
      watchedUserIds,
      filteredAccounts,
      accounts,
      currentUser,
      groupUsers
    );
  }, [watchedUserIds, filteredAccounts, accounts, currentUser, groupUsers]);

  // Load recurring series data for edit mode
  useEffect(() => {
    if (isOpen && isEditMode && editId) {
      // Find series in store
      const series = storeRecurringSeries.find((s) => s.id === editId);

      if (series) {
        // Handle date formatting
        const startDateStr = formatDateForInput(series.start_date);
        const endDateStr = formatDateForInput(series.end_date);

        reset({
          description: series.description,
          amount: series.amount.toString(),
          type: series.type === 'transfer' ? 'expense' : series.type,
          category: series.category,
          frequency: series.frequency,
          user_ids: series.user_ids,
          account_id: series.account_id,
          start_date: startDateStr,
          end_date: endDateStr,
          due_day: series.due_day.toString(),
        });
      }
    } else if (isOpen && !isEditMode) {
      // Reset to defaults for create mode
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
  }, [
    isOpen,
    isEditMode,
    editId,
    selectedUserId,
    currentUser.id,
    reset,
    today,
    storeRecurringSeries,
  ]);

  // Prepopulate account when users change
  useEffect(() => {
    if (!isOpen || !defaultAccountId) return;

    // Only update account in CREATE mode, not EDIT mode
    if (!isEditMode && defaultAccountId !== watchedAccountId) {
      setValue('account_id', defaultAccountId);
    }
  }, [isOpen, watchedUserIds, defaultAccountId, watchedAccountId, setValue, isEditMode]);

  // Handle Update Logic
  const handleUpdate = async (seriesData: RecurringTransactionSeriesData) => {
    if (!editId) return;

    const originalSeries = storeRecurringSeries.find((s) => s.id === editId);
    if (!originalSeries) {
      setError('root', { message: t('errors.notFound') });
      return;
    }

    updateRecurringSeries(editId, seriesData);

    const result = await updateRecurringSeriesAction({
      id: editId,
      ...seriesData,
    });

    if (result.error) {
      updateRecurringSeries(editId, originalSeries);
      setError('root', { message: result.error });
      toast({ title: t('toast.errorTitle'), description: result.error, variant: 'destructive' });
      return;
    }

    if (result.data) {
      updateRecurringSeries(editId, result.data);
      toast({
        title: t('toast.updatedTitle'),
        description: t('toast.updatedDescription'),
        variant: 'success',
      });
    }
  };

  // Handle Create Logic
  const handleCreate = async (seriesData: RecurringTransactionSeriesData) => {
    const tempId = getTempId('temp-recurring');
    const now = new Date().toISOString();
    const optimisticSeries: RecurringTransactionSeries = {
      id: tempId,
      created_at: now,
      updated_at: now,
      is_active: true,
      total_executions: 0,
      ...seriesData,
    };

    addRecurringSeries(optimisticSeries);
    onClose();

    const result = await createRecurringSeriesAction(seriesData);

    if (result.error) {
      removeRecurringSeries(tempId);
      toast({ title: t('toast.errorTitle'), description: result.error, variant: 'destructive' });
      return;
    }

    removeRecurringSeries(tempId);
    if (result.data) {
      addRecurringSeries(result.data);
      toast({
        title: t('toast.createdTitle'),
        description: t('toast.createdDescription'),
        variant: 'success',
      });
    }
  };

  // Handle form submission with optimistic updates
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

      // Close modal on success (for update mode)
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
    updateRecurringSeries(editId, { is_active: nextActive });
    const result = await toggleRecurringSeriesActiveAction(editId, nextActive);
    if (result.error) {
      updateRecurringSeries(editId, { is_active: editingSeries.is_active });
      toast({ title: t('toast.errorTitle'), description: result.error, variant: 'destructive' });
      return;
    }
    if (result.data) {
      updateRecurringSeries(editId, result.data);
      toast({
        title: nextActive ? tSeriesCard('actions.resume') : tSeriesCard('actions.pause'),
        description: t('toast.updatedDescription'),
        variant: 'success',
      });
    }
  };

  const handleDeleteSeries = async () => {
    if (!editId || !editingSeries) return;
    removeRecurringSeries(editId);
    onClose();
    const result = await deleteRecurringSeriesAction(editId);
    if (result.error) {
      addRecurringSeries(editingSeries);
      toast({ title: t('toast.errorTitle'), description: result.error, variant: 'destructive' });
      return;
    }
    toast({
      title: tSeriesCard('actions.delete'),
      description: t('toast.updatedDescription'),
      variant: 'success',
    });
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

          <section
            className={cn(s.amountSection, 'group/amount')}
            aria-labelledby="recurring-amount-label"
          >
            <p id="recurring-amount-label" className={s.amountEyebrow}>
              {t('fields.amount.label')}
            </p>
            <div className={s.amountRow}>
              <span className={s.amountCurrency} aria-hidden>
                €
              </span>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <FormCurrencyInput
                    value={field.value}
                    onChange={(v) => field.onChange(v)}
                    placeholder={t('fields.amount.placeholder')}
                    disabled={isSubmitting}
                    className={s.amountInput}
                    showSymbol={false}
                  />
                )}
              />
            </div>
            <div className={s.amountTrack} aria-hidden>
              <div className={s.amountTrackFill} />
            </div>
            {errors.amount ? <p className={s.fieldError}>{errors.amount.message}</p> : null}
          </section>

          <div className={s.fieldStack}>
            <CategoryField
              value={watchedCategory}
              onChange={(value) => setValue('category', value)}
              error={errors.category?.message}
              categories={categories}
              label={t('fields.category.label')}
              placeholder={t('fields.category.placeholder')}
            />

            <AccountField
              value={watchedAccountId}
              onChange={(value) => setValue('account_id', value)}
              error={errors.account_id?.message}
              accounts={filteredAccounts}
              label={t('fields.account.label')}
              placeholder={t('fields.account.placeholder')}
              required
            />

            <DateField
              label={t('fields.startDate.label')}
              value={watchedStartDate}
              onChange={(value) => setValue('start_date', value)}
              error={errors.start_date?.message}
              required
            />

            <DateField
              label={t('fields.endDate.label')}
              value={watchedEndDate || ''}
              onChange={(value) => setValue('end_date', value)}
              error={errors.end_date?.message}
            />

            <div className="space-y-1">
              <p className={s.noteLabel}>{t('fields.users.label')}</p>
              <MultiUserSelect
                value={watchedUserIds}
                onChange={(value) => setValue('user_ids', value)}
                users={groupUsers}
                currentUserId={currentUser.id}
              />
              {errors.user_ids?.message ? (
                <p className={s.fieldError}>{errors.user_ids.message}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3">
              <div className="space-y-1">
                <FormSelect
                  value={watchedType}
                  onValueChange={(value) => setValue('type', value as 'income' | 'expense')}
                  options={[
                    { value: 'expense', label: t('typeOptions.expense') },
                    { value: 'income', label: t('typeOptions.income') },
                  ]}
                  captionLabel={t('fields.type.label')}
                  leadingIcon={<ArrowLeftRight className="h-5 w-5 text-[#b8c5ff]" aria-hidden />}
                />
                {errors.type?.message ? (
                  <p className={s.fieldError}>{errors.type.message}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <FormSelect
                  value={watchedFrequency}
                  onValueChange={(value) =>
                    setValue('frequency', value as TransactionFrequencyType)
                  }
                  options={[
                    { value: 'once', label: t('frequencyOptions.once') },
                    { value: 'weekly', label: t('frequencyOptions.weekly') },
                    { value: 'biweekly', label: t('frequencyOptions.biweekly') },
                    { value: 'monthly', label: t('frequencyOptions.monthly') },
                    { value: 'yearly', label: t('frequencyOptions.yearly') },
                  ]}
                  captionLabel={t('fields.frequency.label')}
                  leadingIcon={<CalendarClock className="h-5 w-5 text-[#b8c5ff]" aria-hidden />}
                />
                {errors.frequency?.message ? (
                  <p className={s.fieldError}>{errors.frequency.message}</p>
                ) : null}
              </div>
            </div>

            <div className={s.noteShell}>
              <label htmlFor="recurring-due-day" className={s.noteLabel}>
                {t('fields.dueDay.label')}
              </label>
              <Input
                id="recurring-due-day"
                type="number"
                min={1}
                max={31}
                {...register('due_day')}
                placeholder={t('fields.dueDay.placeholder')}
                disabled={isSubmitting}
                className={s.noteInput}
                autoComplete="off"
              />
              <p className="mt-2 px-0 text-[11px] leading-snug text-[#9fb0d7]/90">
                {t('fields.dueDay.helper')}
              </p>
              {errors.due_day?.message ? (
                <p className={cn(s.fieldError, 'mt-2')}>{errors.due_day.message}</p>
              ) : null}
            </div>

            <div className={s.noteShell}>
              <label htmlFor="recurring-description" className={s.noteLabel}>
                {t('fields.description.label')}
              </label>
              <Input
                id="recurring-description"
                {...register('description')}
                placeholder={t('fields.description.placeholder')}
                disabled={isSubmitting}
                className={s.noteInput}
                autoComplete="off"
              />
              {errors.description?.message ? (
                <p className={cn(s.fieldError, 'mt-2')}>{errors.description.message}</p>
              ) : null}
            </div>
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

// Default export for lazy loading
export default RecurringFormModal;
