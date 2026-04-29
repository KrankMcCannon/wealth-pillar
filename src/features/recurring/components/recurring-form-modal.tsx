'use client';

import { cn } from '@/lib/utils';
import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { ArrowLeftRight, CalendarClock } from 'lucide-react';
import { RecurringTransactionSeries, TransactionFrequencyType } from '@/lib/types';
import { getTempId } from '@/lib/utils/temp-id';
import { ModalWrapper, ModalBody, ModalFooter, ModalSection } from '@/components/ui/modal-wrapper';
import { FormActions, FormField, FormSelect, MultiUserSelect } from '@/components/form';
import { AccountField, AmountField, CategoryField, DateField, Input } from '@/components/ui';
import { createRecurringSeriesAction, updateRecurringSeriesAction } from '@/features/recurring';
import { todayDateString } from '@/lib/utils/date-utils';
import { useRequiredCurrentUser, useRequiredGroupUsers, useRequiredGroupId } from '@/hooks';
import { useAccounts, useCategories } from '@/stores/reference-data-store';
import { useUserFilterStore } from '@/stores/user-filter-store';
import { usePageDataStore } from '@/stores/page-data-store';
import { toast } from '@/hooks/use-toast';
import { recurringStyles } from '../theme/recurring-styles';

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
  const description = isEditMode ? t('description.edit') : t('description.create');
  const recurringSchema = useMemo(() => createRecurringSchema(t), [t]);

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
  const watchedAmount = useWatch({ control, name: 'amount' });
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

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onClose}
      title={title}
      description={description}
      maxWidth="md"
      repositionInputs={false}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={cn(recurringStyles.formModal.form, 'flex min-h-0 flex-1 flex-col')}
      >
        <ModalBody className={recurringStyles.formModal.content}>
          {/* Submit Error Display */}
          {errors.root && (
            <div className={recurringStyles.formModal.error}>
              <p className="text-sm font-medium text-destructive">{errors.root.message}</p>
            </div>
          )}

          <ModalSection title={t('sections.basics')} className={recurringStyles.formModal.section}>
            <div className={recurringStyles.formModal.grid}>
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
                  <p className="text-sm text-destructive">{errors.type.message}</p>
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
                  <p className="text-sm text-destructive">{errors.frequency.message}</p>
                ) : null}
              </div>
            </div>
          </ModalSection>

          <ModalSection className={recurringStyles.formModal.section}>
            <FormField
              label={t('fields.description.label')}
              required
              error={errors.description?.message}
            >
              <Input
                {...register('description')}
                placeholder={t('fields.description.placeholder')}
                disabled={isSubmitting}
              />
            </FormField>
          </ModalSection>

          <ModalSection
            title={t('sections.participants')}
            className={recurringStyles.formModal.section}
          >
            <FormField label={t('fields.users.label')} required error={errors.user_ids?.message}>
              <MultiUserSelect
                value={watchedUserIds}
                onChange={(value) => setValue('user_ids', value)}
                users={groupUsers}
                currentUserId={currentUser.id}
              />
            </FormField>
          </ModalSection>

          <ModalSection title={t('sections.amounts')} className={recurringStyles.formModal.section}>
            <div className={recurringStyles.formModal.grid}>
              <AccountField
                value={watchedAccountId}
                onChange={(value) => setValue('account_id', value)}
                error={errors.account_id?.message}
                accounts={filteredAccounts}
                label={t('fields.account.label')}
                placeholder={t('fields.account.placeholder')}
                required
              />

              <CategoryField
                value={watchedCategory}
                onChange={(value) => setValue('category', value)}
                error={errors.category?.message}
                categories={categories}
                label={t('fields.category.label')}
                placeholder={t('fields.category.placeholder')}
              />

              <AmountField
                value={watchedAmount}
                onChange={(value) => setValue('amount', value)}
                error={errors.amount?.message}
                label={t('fields.amount.label')}
                placeholder={t('fields.amount.placeholder')}
                required
              />

              <FormField
                label={t('fields.dueDay.label')}
                required
                error={errors.due_day?.message}
                helperText={t('fields.dueDay.helper')}
              >
                <Input
                  type="number"
                  min={1}
                  max={31}
                  {...register('due_day')}
                  placeholder={t('fields.dueDay.placeholder')}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>
          </ModalSection>

          <ModalSection
            title={t('sections.schedule')}
            className={recurringStyles.formModal.section}
          >
            <div className={recurringStyles.formModal.grid}>
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
            </div>
          </ModalSection>
        </ModalBody>

        <ModalFooter>
          <FormActions
            submitType="submit"
            submitLabel={isEditMode ? t('buttons.saveChanges') : t('buttons.createSeries')}
            cancelLabel={t('buttons.cancel')}
            onCancel={onClose}
            isSubmitting={isSubmitting}
            className="w-full sm:w-auto"
          />
        </ModalFooter>
      </form>
    </ModalWrapper>
  );
}

// Default export for lazy loading
export default RecurringFormModal;
