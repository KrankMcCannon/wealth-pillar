'use client';

import { cn } from '@/lib/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Loader2, PieChart, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Budget, BudgetType } from '@/lib/types';
import { getTempId } from '@/lib/utils/temp-id';
import { createBudgetAction, deleteBudgetAction, updateBudgetAction } from '@/features/budgets';
import { ModalWrapper } from '@/components/ui/modal-wrapper';
import { FormCurrencyInput, FormField, FormSelect } from '@/components/form';
import { Input, UserField } from '@/components/ui';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import {
  usePermissions,
  useRequiredCurrentUser,
  useRequiredGroupUsers,
  useRequiredGroupId,
} from '@/hooks';
import { useCategories } from '@/stores/reference-data-store';
import { useUserFilterStore } from '@/stores/user-filter-store';
import { usePageDataStore } from '@/stores/page-data-store';
import { toast } from '@/hooks/use-toast';
import { stitchBudgetFormModal } from '@/styles/home-design-foundation';
import { BudgetCategoryPicker } from './budget-category-picker';

type BudgetFormData = {
  description: string;
  amount: string;
  type: BudgetType;
  icon?: string | null | undefined;
  categories: string[];
  user_id: string;
  categorySearch?: string | undefined;
};

interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

function BudgetFormModal({ isOpen, onClose, editId }: Readonly<BudgetFormModalProps>) {
  const t = useTranslations('Budgets.FormModal');
  const locale = useLocale();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const s = stitchBudgetFormModal;

  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();
  const categories = useCategories();
  const groupId = useRequiredGroupId();
  const selectedUserId = useUserFilterStore((state) => state.selectedUserId);

  const storeBudgets = usePageDataStore((state) => state.budgets);
  const addBudget = usePageDataStore((state) => state.addBudget);
  const updateBudget = usePageDataStore((state) => state.updateBudget);
  const removeBudget = usePageDataStore((state) => state.removeBudget);

  const isEditMode = !!editId;
  const title = isEditMode ? t('title.edit') : t('title.create');
  const description = isEditMode ? t('description.edit') : t('description.create');

  const { shouldDisableUserField, defaultFormUserId, userFieldHelperText } = usePermissions({
    currentUser,
    selectedUserId,
  });

  const budgetSchema = useMemo(
    () =>
      z.object({
        description: z.string().min(2, t('validation.descriptionMin')).trim(),
        amount: z
          .string()
          .min(1, t('validation.amountRequired'))
          .refine((val) => !Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) > 0, {
            message: t('validation.amountPositive'),
          }),
        type: z.enum(['monthly', 'annually']),
        icon: z.string().nullable().optional(),
        categories: z.array(z.string()).min(1, t('validation.categoriesRequired')),
        user_id: z.string().min(1, t('validation.userRequired')),
        categorySearch: z.string().optional(),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      description: '',
      amount: '',
      type: 'monthly',
      icon: null,
      categories: [],
      user_id: defaultFormUserId,
      categorySearch: '',
    },
  });

  const watchedType = useWatch({ control, name: 'type' });
  const watchedCategories = useWatch({ control, name: 'categories' });
  const watchedUserId = useWatch({ control, name: 'user_id' });
  const categorySearch = useWatch({ control, name: 'categorySearch' }) || '';

  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      value: category.key,
      label: category.label,
      color: category.color,
    }));
  }, [categories]);

  useEffect(() => {
    if (isOpen && isEditMode && editId) {
      const budget = storeBudgets.find((b) => b.id === editId);

      if (budget) {
        reset({
          description: budget.description,
          amount: budget.amount.toString(),
          type: budget.type,
          icon: budget.icon,
          categories: budget.categories,
          user_id: budget.user_id,
          categorySearch: '',
        });
      }
    } else if (isOpen && !isEditMode) {
      reset({
        description: '',
        amount: '',
        type: 'monthly',
        icon: null,
        categories: [],
        user_id: defaultFormUserId,
        categorySearch: '',
      });
    }
  }, [isOpen, isEditMode, editId, defaultFormUserId, reset, storeBudgets]);

  const handleToggleCategory = useCallback(
    (categoryId: string) => {
      const current = watchedCategories;
      const next = current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : Array.from(new Set([...current, categoryId]));
      setValue('categories', next);
    },
    [setValue, watchedCategories]
  );

  const handleSelectAllCategories = useCallback(() => {
    if (!categoryOptions.length) return;
    setValue(
      'categories',
      categoryOptions.map((option) => option.value)
    );
  }, [categoryOptions, setValue]);

  const handleClearCategories = useCallback(() => {
    setValue('categories', []);
  }, [setValue]);

  const handleUpdate = async (data: BudgetFormData, id: string) => {
    const amount = Number.parseFloat(data.amount);
    const budgetData = {
      description: data.description.trim(),
      amount,
      type: data.type,
      icon: data.icon ?? null,
      categories: data.categories,
      user_id: data.user_id,
      group_id: groupId,
    };

    const originalBudget = storeBudgets.find((b) => b.id === id);
    if (!originalBudget) {
      throw new Error(t('errors.notFound'));
    }

    updateBudget(id, budgetData);

    const result = await updateBudgetAction(id, budgetData, locale);

    if (result.error) {
      updateBudget(id, originalBudget);
      toast({
        title: t('toast.errorTitle'),
        description: `${result.error}\n\n${t('toast.revertedHint')}`,
        variant: 'destructive',
      });
      throw new Error(result.error);
    }

    if (result.data) {
      updateBudget(id, result.data);
      toast({
        title: t('toast.updatedTitle'),
        description: t('toast.updatedDescription'),
        variant: 'success',
      });
    }
  };

  const handleCreate = async (data: BudgetFormData) => {
    const amount = Number.parseFloat(data.amount);
    const budgetData = {
      description: data.description.trim(),
      amount,
      type: data.type,
      icon: data.icon ?? null,
      categories: data.categories,
      user_id: data.user_id,
      group_id: groupId,
    };

    const tempId = getTempId('temp-budget');
    const now = new Date().toISOString();
    const optimisticBudget: Budget = {
      id: tempId,
      created_at: now,
      updated_at: now,
      ...budgetData,
    };

    addBudget(optimisticBudget);
    onClose();

    const result = await createBudgetAction(budgetData, locale);

    if (result.error) {
      removeBudget(tempId);
      toast({
        title: t('toast.errorTitle'),
        description: `${result.error}\n\n${t('toast.optimisticCreateFailedHint')}`,
        variant: 'destructive',
      });
      return;
    }

    removeBudget(tempId);
    if (result.data) {
      addBudget(result.data);
      toast({
        title: t('toast.createdTitle'),
        description: t('toast.createdDescription'),
        variant: 'success',
      });
    }
  };

  const onSubmit = async (data: BudgetFormData) => {
    try {
      if (isEditMode && editId) {
        await handleUpdate(data, editId);
        onClose();
      } else {
        await handleCreate(data);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.unknown');
      setError('root', { message });
    }
  };

  const executeDelete = useCallback(async () => {
    if (!editId) return;

    const original = storeBudgets.find((b) => b.id === editId);
    if (!original) {
      toast({
        title: t('toast.errorTitle'),
        description: t('errors.notFound'),
        variant: 'destructive',
      });
      setDeleteDialogOpen(false);
      return;
    }

    setIsDeleting(true);
    removeBudget(editId);

    try {
      const result = await deleteBudgetAction(editId, locale);

      if (result.error) {
        addBudget(original);
        toast({
          title: t('toast.errorTitle'),
          description: `${result.error}\n\n${t('toast.revertedHint')}`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: t('toast.deletedTitle'),
        description: t('toast.deletedDescription'),
        variant: 'success',
      });
      setDeleteDialogOpen(false);
      onClose();
      router.refresh();
    } catch (error) {
      addBudget(original);
      const message = error instanceof Error ? error.message : t('errors.unknown');
      toast({
        title: t('toast.errorTitle'),
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [
    editId,
    storeBudgets,
    removeBudget,
    addBudget,
    locale,
    router,
    onClose,
    t,
  ]);

  const footerBusy = isSubmitting || isDeleting;

  return (
    <>
      <ModalWrapper
        isOpen={isOpen}
        onOpenChange={onClose}
        title={title}
        description={description}
        titleClassName={s.headerTitle}
        descriptionClassName="text-left text-[#9fb0d7]"
        maxWidth="md"
        repositionInputs={false}
        handleClassName={s.handle}
        drawerHeaderClassName={s.drawerHeaderShell}
        drawerCloseClassName={s.headerClose}
        showCloseButton
        className={s.drawerSurface}
      >
        <form onSubmit={handleSubmit(onSubmit)} className={s.formColumn}>
          <div className={cn(s.scrollBody, 'overflow-x-hidden')}>
            {errors.root ? (
              <div className={s.errorBanner} role="alert">
                {errors.root.message}
              </div>
            ) : null}

            <section
              className={cn(s.amountSection, 'group/amount')}
              aria-labelledby="budget-amount-label"
            >
              <p id="budget-amount-label" className={s.amountEyebrow}>
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
              {errors.amount?.message ? (
                <p className={s.fieldError}>{errors.amount.message}</p>
              ) : null}
            </section>

            <div className={s.gridTwoCol}>
              <UserField
                value={watchedUserId}
                onChange={(value) => setValue('user_id', value)}
                error={errors.user_id?.message}
                users={groupUsers}
                label={t('fields.user.label')}
                placeholder={t('fields.user.placeholder')}
                disabled={shouldDisableUserField}
                helperText={userFieldHelperText}
                required
              />

              <div className="space-y-1">
                <FormSelect
                  value={watchedType}
                  onValueChange={(value) => setValue('type', value as BudgetType)}
                  options={[
                    { value: 'monthly', label: t('fields.type.options.monthly') },
                    { value: 'annually', label: t('fields.type.options.annually') },
                  ]}
                  captionLabel={t('fields.type.label')}
                  leadingIcon={<PieChart className="h-5 w-5 text-[#b8c5ff]" aria-hidden />}
                />
                {errors.type?.message ? (
                  <p className={s.fieldError}>{errors.type.message}</p>
                ) : null}
              </div>
            </div>

            <div className={s.noteShell}>
              <label htmlFor="budget-description" className={s.noteLabel}>
                {t('fields.description.label')}
              </label>
              <Input
                id="budget-description"
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

            <FormField
              label={t('fields.categories.label')}
              required
              error={errors.categories?.message}
              className="space-y-2"
            >
              <BudgetCategoryPicker
                options={categoryOptions}
                selectedIds={watchedCategories}
                searchValue={categorySearch}
                onSearchChange={(value) => setValue('categorySearch', value)}
                onToggleCategory={handleToggleCategory}
                onSelectAll={handleSelectAllCategories}
                onClearSelection={handleClearCategories}
                disabled={isSubmitting}
              />
            </FormField>
          </div>

          <div className={s.stickyFooter}>
            <div className={s.footerActionsStack}>
              <button type="submit" disabled={footerBusy} className={s.primaryCta}>
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Check className="h-5 w-5 shrink-0" aria-hidden />
                )}
                {isEditMode ? t('buttons.confirmChanges') : t('buttons.create')}
              </button>
              {isEditMode && editId ? (
                <button
                  type="button"
                  data-testid="budget-form-delete"
                  disabled={footerBusy}
                  onClick={() => setDeleteDialogOpen(true)}
                  className={s.deleteButton}
                >
                  <Trash2 className="h-5 w-5 shrink-0" aria-hidden />
                  {t('buttons.deleteBudget')}
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </ModalWrapper>

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={executeDelete}
        title={t('deleteDialogTitle')}
        message={t('deleteConfirm')}
        confirmText={t('buttons.deleteBudget')}
        cancelText={t('buttons.cancel')}
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}

export default BudgetFormModal;
