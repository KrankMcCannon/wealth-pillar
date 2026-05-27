'use client';

import { useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import {
  createBudgetAction,
  deleteBudgetAction,
  getBudgetByIdAction,
  updateBudgetAction,
} from '@/features/budgets';
import {
  EntityFormModal,
  EntityFormFooter,
  useEntityFormPermissions,
  useEntityFormRowReset,
  useEntityFormSubmit,
} from '@/components/form';
import { useCategories } from '@/stores/reference-data-store';
import { useReferenceDataStore } from '@/stores/reference-data-store';
import { getTempId } from '@/lib/utils/temp-id';
import type { Budget } from '@/lib/types';
import { BudgetFormFields, type BudgetFormData } from './budget-form-fields';
import { buildBudgetPayload, mapBudgetToFormData } from '@/features/budgets/utils/budget-form-data';

interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

function BudgetFormModalBody({
  form,
  groupUsers,
  categoryOptions,
  shouldDisableUserField,
  userFieldHelperText,
  isSubmitting,
}: Readonly<{
  form: Parameters<typeof BudgetFormFields>[0]['form'];
  groupUsers: ReturnType<typeof useEntityFormPermissions>['groupUsers'];
  categoryOptions: { value: string; label: string; color: string }[];
  shouldDisableUserField: boolean;
  userFieldHelperText?: string | undefined;
  isSubmitting: boolean;
}>) {
  return (
    <BudgetFormFields
      form={form}
      groupUsers={groupUsers}
      categoryOptions={categoryOptions}
      shouldDisableUserField={shouldDisableUserField}
      userFieldHelperText={userFieldHelperText}
      isSubmitting={isSubmitting}
    />
  );
}

function BudgetFormModal({ isOpen, onClose, editId }: Readonly<BudgetFormModalProps>) {
  const t = useTranslations('Budgets.FormModal');
  const locale = useLocale();
  const router = useRouter();

  const { groupUsers, groupId, shouldDisableUserField, defaultFormUserId, userFieldHelperText } =
    useEntityFormPermissions();
  const categories = useCategories();
  const addBudget = useReferenceDataStore((state) => state.addBudget);
  const updateBudget = useReferenceDataStore((state) => state.updateBudget);
  const removeBudget = useReferenceDataStore((state) => state.removeBudget);
  const storeBudgets = useReferenceDataStore((state) => state.budgets);

  const isEditMode = Boolean(editId);
  const title = isEditMode ? t('title.edit') : t('title.create');
  const description = isEditMode ? t('description.edit') : t('description.create');

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
      }),
    [t]
  );

  const createDefaults = useMemo(
    (): BudgetFormData => ({
      description: '',
      amount: '',
      type: 'monthly',
      icon: null,
      categories: [],
      user_id: defaultFormUserId,
    }),
    [defaultFormUserId]
  );

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.key,
        label: category.label,
        color: category.color,
      })),
    [categories]
  );

  const loadEditValues = useCallback(async (id: string, signal: AbortSignal) => {
    const result = await getBudgetByIdAction(id);
    if (signal.aborted) return null;
    if (!result.data) return null;
    return mapBudgetToFormData(result.data);
  }, []);

  const { resetValues, isReady, isLoading } = useEntityFormRowReset({
    editId,
    createValues: createDefaults,
    loadEditValues,
  });

  const buildPayload = useCallback(
    (data: BudgetFormData) => buildBudgetPayload(data, groupId),
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
    BudgetFormData,
    ReturnType<typeof buildPayload>,
    Budget,
    string | { originalBudget: Budget; id: string }
  >({
    isEditMode,
    editId,
    onClose,
    buildPayload,
    createAction: (payload) => createBudgetAction(payload, locale),
    updateAction: (id, payload) => updateBudgetAction(id, payload, locale),
    applyCreateOptimistic: (payload) => {
      const tempId = getTempId('temp-budget');
      const now = new Date().toISOString();
      const optimistic: Budget = {
        id: tempId,
        description: payload.description,
        amount: payload.amount,
        type: payload.type,
        icon: payload.icon ?? null,
        categories: payload.categories,
        user_id: payload.user_id,
        group_id: payload.group_id,
        created_at: now,
        updated_at: now,
      };
      addBudget(optimistic);
      return tempId;
    },
    commitCreate: (handle, result) => {
      if (typeof handle !== 'string') return;
      removeBudget(handle);
      addBudget(result);
    },
    rollbackCreate: (handle) => {
      if (typeof handle !== 'string') return;
      removeBudget(handle);
    },
    applyUpdateOptimistic: (id, payload) => {
      const originalBudget = storeBudgets.find((budget) => budget.id === id);
      if (!originalBudget) {
        throw new Error(t('errors.notFound'));
      }
      updateBudget(id, {
        description: payload.description,
        amount: payload.amount,
        type: payload.type,
        icon: payload.icon ?? null,
        categories: payload.categories,
        user_id: payload.user_id,
      });
      return { originalBudget, id };
    },
    commitUpdate: (_handle, result) => {
      updateBudget(result.id, result);
    },
    rollbackUpdate: (handle) => {
      if (typeof handle === 'string') return;
      updateBudget(handle.id, handle.originalBudget);
    },
    getSuccessToast,
    errorToast: { title: t('toast.errorTitle') },
    unknownErrorMessage: t('errors.unknown'),
  });

  const handleDelete = useCallback(async () => {
    if (!editId) return;
    const result = await deleteBudgetAction(editId, locale);
    if (result.error) {
      throw new Error(result.error);
    }
    toast({
      title: t('toast.deletedTitle'),
      description: t('toast.deletedDescription'),
      variant: 'success',
    });
    router.refresh();
  }, [editId, locale, router, t]);

  return (
    <EntityFormModal<BudgetFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      schema={budgetSchema}
      defaultValues={createDefaults}
      resetValues={resetValues ?? createDefaults}
      isLoading={Boolean(editId) && (isLoading || !isReady)}
      bodyClassName={cn('overflow-x-hidden')}
      {...(isEditMode && editId
        ? {
            deletion: {
              enabled: true,
              title: t('deleteDialogTitle'),
              message: t('deleteConfirm'),
              confirmText: t('buttons.deleteBudget'),
              cancelText: t('buttons.cancel'),
              onDelete: handleDelete,
            },
          }
        : {})}
      onSubmit={handleSubmit}
      footer={(_, isSubmitting, { openDeleteDialog }) => (
        <EntityFormFooter
          isEditMode={isEditMode}
          isSubmitting={isSubmitting}
          submitLabel={isEditMode ? t('buttons.confirmChanges') : t('buttons.create')}
          deleteLabel={t('buttons.deleteBudget')}
          deleteTestId="budget-form-delete"
          showSubmitSpinner
          {...(openDeleteDialog ? { onDelete: openDeleteDialog } : {})}
        />
      )}
    >
      {(form) => (
        <BudgetFormModalBody
          form={form}
          groupUsers={groupUsers}
          categoryOptions={categoryOptions}
          shouldDisableUserField={shouldDisableUserField}
          userFieldHelperText={userFieldHelperText}
          isSubmitting={form.formState.isSubmitting}
        />
      )}
    </EntityFormModal>
  );
}

export default BudgetFormModal;
