'use client';
import { cn } from '@/lib/utils';
import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { Budget, BudgetType } from '@/lib/types';
import { getTempId } from '@/lib/utils/temp-id';
import { createBudgetAction, updateBudgetAction } from '@/features/budgets';
import { ModalWrapper, ModalBody, ModalFooter, ModalSection } from '@/components/ui/modal-wrapper';
import { FormActions, FormField, FormSelect } from '@/components/form';
import { AmountField, Checkbox, Input, UserField } from '@/components/ui';
import {
  usePermissions,
  useRequiredCurrentUser,
  useRequiredGroupUsers,
  useRequiredGroupId,
} from '@/hooks';
import { useCategories } from '@/stores/reference-data-store';
import { useUserFilterStore } from '@/stores/user-filter-store';
import { usePageDataStore } from '@/stores/page-data-store';
import { budgetStyles, getBudgetCategoryColorStyle } from '@/styles/system';

type BudgetFormData = {
  description: string;
  amount: string;
  type: BudgetType;
  icon?: string | null;
  categories: string[];
  user_id: string;
  categorySearch?: string;
};

interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

function BudgetFormModal({ isOpen, onClose, editId }: Readonly<BudgetFormModalProps>) {
  const t = useTranslations('Budgets.FormModal');
  const locale = useLocale();
  // Read from stores instead of props
  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();
  const categories = useCategories();
  const groupId = useRequiredGroupId();
  const selectedUserId = useUserFilterStore((state) => state.selectedUserId);

  // Page data store actions for optimistic updates
  const storeBudgets = usePageDataStore((state) => state.budgets);
  const addBudget = usePageDataStore((state) => state.addBudget);
  const updateBudget = usePageDataStore((state) => state.updateBudget);
  const removeBudget = usePageDataStore((state) => state.removeBudget);

  const isEditMode = !!editId;
  const title = isEditMode ? t('title.edit') : t('title.create');
  const description = isEditMode ? t('description.edit') : t('description.create');

  // Permission checks
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

  // React Hook Form setup
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
  const watchedAmount = useWatch({ control, name: 'amount' });
  const categorySearch = useWatch({ control, name: 'categorySearch' }) || '';

  // Convert categories to checkbox options
  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      value: category.key,
      label: category.label,
      color: category.color,
    }));
  }, [categories]);

  const filteredCategoryOptions = useMemo(() => {
    if (!categorySearch.trim()) {
      return categoryOptions;
    }

    const query = categorySearch.trim().toLowerCase();
    return categoryOptions.filter((option) => option.label.toLowerCase().includes(query));
  }, [categoryOptions, categorySearch]);

  // Load budget data for edit mode
  useEffect(() => {
    if (isOpen && isEditMode && editId) {
      // Find budget in store
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
      // Reset to defaults for create mode
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

  // Handle category toggle
  const handleCategoryToggle = (categoryId: string, checked: CheckedState) => {
    const isChecked = checked === true || checked === 'indeterminate';
    const currentCategories = watchedCategories || [];
    const updatedCategories = isChecked
      ? Array.from(new Set([...currentCategories, categoryId]))
      : currentCategories.filter((id) => id !== categoryId);

    setValue('categories', updatedCategories);
  };

  // Select all categories
  const handleSelectAllCategories = () => {
    if (!categoryOptions.length) return;
    setValue(
      'categories',
      categoryOptions.map((option) => option.value)
    );
  };

  // Clear all categories
  const handleClearCategories = () => {
    setValue('categories', []);
  };

  // Handle update budget flow
  const handleUpdate = async (data: BudgetFormData, id: string) => {
    const amount = Number.parseFloat(data.amount);
    const budgetData = {
      description: data.description.trim(),
      amount,
      type: data.type as BudgetType,
      icon: data.icon ?? null,
      categories: data.categories,
      user_id: data.user_id,
      group_id: groupId,
    };

    // 1. Store original budget for revert
    const originalBudget = storeBudgets.find((b) => b.id === id);
    if (!originalBudget) {
      throw new Error(t('errors.notFound'));
    }

    // 2. Update in store immediately (optimistic)
    updateBudget(id, budgetData);

    // 3. Call server action
    const result = await updateBudgetAction(id, budgetData, locale);

    if (result.error) {
      // 4. Revert on error
      updateBudget(id, originalBudget);
      throw new Error(result.error);
    }

    // 5. Success - update with real data from server
    if (result.data) {
      updateBudget(id, result.data);
    }
  };

  // Handle create budget flow
  const handleCreate = async (data: BudgetFormData) => {
    const amount = Number.parseFloat(data.amount);
    const budgetData = {
      description: data.description.trim(),
      amount,
      type: data.type as BudgetType,
      icon: data.icon ?? null,
      categories: data.categories,
      user_id: data.user_id,
      group_id: groupId,
    };

    // 1. Create temporary ID
    const tempId = getTempId('temp-budget');
    const now = new Date().toISOString();
    const optimisticBudget: Budget = {
      id: tempId,
      created_at: now,
      updated_at: now,
      ...budgetData,
    };

    // 2. Add to store immediately (optimistic)
    addBudget(optimisticBudget);

    // 3. Close modal immediately for better UX
    onClose();

    // 4. Call server action in background
    const result = await createBudgetAction(budgetData, locale);

    if (result.error) {
      // 5. Remove optimistic budget on error
      removeBudget(tempId);
      console.error('Failed to create budget:', result.error);
      return;
    }

    // 6. Replace temporary with real budget from server
    removeBudget(tempId);
    if (result.data) {
      addBudget(result.data);
    }
  };

  // Handle form submission with optimistic updates
  const onSubmit = async (data: BudgetFormData) => {
    try {
      if (isEditMode && editId) {
        await handleUpdate(data, editId);
        onClose(); // Close on success for update
      } else {
        await handleCreate(data);
        // onClose is called inside handleCreate for immediate feedback
      }
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : t('errors.unknown'),
      });
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
        className={cn(budgetStyles.formModal.form, 'flex flex-col h-full')}
      >
        <ModalBody className={budgetStyles.formModal.content}>
          {/* Submit Error Display */}
          {errors.root && <div className={budgetStyles.formModal.error}>{errors.root.message}</div>}

          <ModalSection className={budgetStyles.formModal.section}>
            <div className={budgetStyles.formModal.grid}>
              {/* User */}
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

              {/* Type */}
              <FormField label={t('fields.type.label')} required error={errors.type?.message}>
                <FormSelect
                  value={watchedType}
                  onValueChange={(value) => setValue('type', value as BudgetType)}
                  options={[
                    { value: 'monthly', label: t('fields.type.options.monthly') },
                    { value: 'annually', label: t('fields.type.options.annually') },
                  ]}
                />
              </FormField>

              {/* Amount */}
              <AmountField
                value={Number.parseFloat(watchedAmount || '0')}
                onChange={(value) => setValue('amount', value.toString())}
                error={errors.amount?.message}
                label={t('fields.amount.label')}
                placeholder={t('fields.amount.placeholder')}
                required
              />
            </div>
          </ModalSection>

          <ModalSection className={budgetStyles.formModal.section}>
            {/* Description */}
            <FormField label={t('fields.description.label')} required error={errors.description?.message}>
              <Input
                {...register('description')}
                placeholder={t('fields.description.placeholder')}
                disabled={isSubmitting}
              />
            </FormField>
          </ModalSection>

          <ModalSection className={budgetStyles.formModal.sectionTight}>
            {/* Categories Selection */}
            <FormField
              label={t('fields.categories.label')}
              required
              error={errors.categories?.message}
              className={budgetStyles.formModal.categoryField}
            >
              <div className={budgetStyles.formModal.categoryBox}>
                <div className={budgetStyles.formModal.categoryHeader}>
                  <Input
                    value={categorySearch}
                    onChange={(event) => setValue('categorySearch', event.target.value)}
                    placeholder={t('fields.categories.searchPlaceholder')}
                    className={budgetStyles.formModal.categorySelect}
                  />
                  <div className={budgetStyles.formModal.categoryMeta}>
                    <span className={budgetStyles.formModal.categoryMetaStrong}>
                      {t('fields.categories.selectedCount', {
                        selected: watchedCategories.length,
                        total: categoryOptions.length,
                      })}
                    </span>
                    <button
                      type="button"
                      className={budgetStyles.formModal.categoryLink}
                      onClick={handleSelectAllCategories}
                      disabled={!categoryOptions.length}
                    >
                      {t('fields.categories.selectAll')}
                    </button>
                    <button
                      type="button"
                      className={budgetStyles.formModal.categoryLink}
                      onClick={handleClearCategories}
                      disabled={!watchedCategories.length}
                    >
                      {t('fields.categories.clear')}
                    </button>
                  </div>
                </div>

                <div className={budgetStyles.formModal.categoryList}>
                  {filteredCategoryOptions.length === 0 ? (
                    <p className={budgetStyles.formModal.categoryEmpty}>{t('fields.categories.empty')}</p>
                  ) : (
                    filteredCategoryOptions.map((option) => (
                      <label key={option.value} className={budgetStyles.formModal.categoryItem}>
                        <Checkbox
                          checked={watchedCategories.includes(option.value)}
                          onCheckedChange={(checked) => handleCategoryToggle(option.value, checked)}
                        />
                        <span className={budgetStyles.formModal.categoryItemRow}>
                          <span
                            className={budgetStyles.formModal.categoryDot}
                            style={getBudgetCategoryColorStyle(option.color)}
                          />
                          {option.label}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </FormField>
          </ModalSection>
        </ModalBody>

        <ModalFooter>
          <FormActions
            submitType="submit"
            submitLabel={isEditMode ? t('buttons.save') : t('buttons.create')}
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
export default BudgetFormModal;
