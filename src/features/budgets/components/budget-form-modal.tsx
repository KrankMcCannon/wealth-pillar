'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  createBudgetAction,
  deleteBudgetAction,
  getBudgetByIdAction,
  updateBudgetAction,
} from '@/features/budgets';
import { EntityFormModal, EntityFormFooter, ModalRootError } from '@/components/form';
import {
  usePermissions,
  useRequiredCurrentUser,
  useRequiredGroupUsers,
  useRequiredGroupId,
} from '@/hooks';
import { useCategories } from '@/stores/reference-data-store';
import { useUserFilter } from '@/hooks/state/use-user-filter';
import { toast } from '@/hooks/use-toast';
import { stitchBudgetFormModal } from '@/styles/home-design-foundation';
import { BudgetFormFields, type BudgetFormData } from './budget-form-fields';

interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

const s = stitchBudgetFormModal;

function BudgetFormModalBody({
  form,
  groupUsers,
  categoryOptions,
  shouldDisableUserField,
  userFieldHelperText,
  isSubmitting,
}: Readonly<{
  form: UseFormReturn<BudgetFormData>;
  groupUsers: ReturnType<typeof useRequiredGroupUsers>;
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
  const [isLoadingRow, setIsLoadingRow] = useState(false);
  const [resetValues, setResetValues] = useState<BudgetFormData | undefined>(undefined);

  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();
  const categories = useCategories();
  const groupId = useRequiredGroupId();
  const { selectedUserId } = useUserFilter();

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

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const run = async () => {
      if (!editId) {
        setIsLoadingRow(false);
        setResetValues(createDefaults);
        return;
      }

      setIsLoadingRow(true);
      const result = await getBudgetByIdAction(editId);
      if (cancelled) return;
      setIsLoadingRow(false);

      const budget = result.data;
      if (!budget) return;

      setResetValues({
        description: budget.description,
        amount: budget.amount.toString(),
        type: budget.type,
        icon: budget.icon,
        categories: budget.categories,
        user_id: budget.user_id,
      });
    };

    run().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [isOpen, editId, createDefaults]);

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

    const result = await updateBudgetAction(id, budgetData, locale);

    if (result.error) {
      toast({
        title: t('toast.errorTitle'),
        description: result.error,
        variant: 'destructive',
      });
      throw new Error(result.error);
    }

    toast({
      title: t('toast.updatedTitle'),
      description: t('toast.updatedDescription'),
      variant: 'success',
    });
    router.refresh();
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

    onClose();

    const result = await createBudgetAction(budgetData, locale);

    if (result.error) {
      toast({
        title: t('toast.errorTitle'),
        description: result.error,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: t('toast.createdTitle'),
      description: t('toast.createdDescription'),
      variant: 'success',
    });
    router.refresh();
  };

  const handleDelete = useCallback(async () => {
    if (!editId) return;

    const result = await deleteBudgetAction(editId, locale);

    if (result.error) {
      toast({
        title: t('toast.errorTitle'),
        description: result.error,
        variant: 'destructive',
      });
      throw new Error(result.error);
    }

    toast({
      title: t('toast.deletedTitle'),
      description: t('toast.deletedDescription'),
      variant: 'success',
    });
    onClose();
    router.refresh();
  }, [editId, locale, onClose, router, t]);

  return (
    <EntityFormModal<BudgetFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      schema={budgetSchema}
      defaultValues={createDefaults}
      resetValues={resetValues ?? createDefaults}
      repositionInputs={false}
      isLoading={Boolean(editId) && isLoadingRow}
      formClassName={s.formColumn}
      bodyClassName={cn(s.scrollBody, 'overflow-x-hidden')}
      footerClassName={s.stickyFooter}
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
      onSubmit={async (data, form) => {
        try {
          if (isEditMode && editId) {
            await handleUpdate(data, editId);
            onClose();
          } else {
            await handleCreate(data);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : t('errors.unknown');
          form.setError('root', { message });
        }
      }}
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
        <>
          {form.formState.errors.root?.message ? (
            <ModalRootError message={form.formState.errors.root.message} />
          ) : null}
          <BudgetFormModalBody
            form={form}
            groupUsers={groupUsers}
            categoryOptions={categoryOptions}
            shouldDisableUserField={shouldDisableUserField}
            userFieldHelperText={userFieldHelperText}
            isSubmitting={form.formState.isSubmitting}
          />
        </>
      )}
    </EntityFormModal>
  );
}

export default BudgetFormModal;
