'use client';

import { useCallback, useMemo } from 'react';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import type { Category } from '@/lib';
import { getTempId } from '@/lib/utils/temp-id';
import { getDefaultColor, isValidColor } from '@/server/use-cases/categories/category.logic';
import { categoryStyles } from '../theme/category-styles';
import { createCategoryAction, updateCategoryAction } from '@/features/categories';
import { EntityFormModal, useEntityFormRowReset, useEntityFormSubmit } from '@/components/form';
import { ModalFooterActions } from '@/components/ui/modal-footer-actions';
import { useRequiredGroupId } from '@/hooks';
import { useCategories, useReferenceDataStore } from '@/stores/reference-data-store';
import { CategoryFormFields, type CategoryFormData } from './category-form-fields';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

function CategoryFormModal({ isOpen, onClose, editId }: Readonly<CategoryFormModalProps>) {
  const t = useTranslations('Categories.FormModal');
  const locale = useLocale();
  const groupId = useRequiredGroupId();

  const storeCategories = useCategories();
  const addCategory = useReferenceDataStore((state) => state.addCategory);
  const updateCategory = useReferenceDataStore((state) => state.updateCategory);
  const removeCategory = useReferenceDataStore((state) => state.removeCategory);

  const isEditMode = Boolean(editId);
  const title = isEditMode ? t('title.edit') : t('title.create');
  const description = isEditMode ? t('description.edit') : t('description.create');

  const categorySchema = useMemo(
    () =>
      z.object({
        label: z.string().min(1, t('validation.labelRequired')).trim(),
        key: z.string().min(1, t('validation.keyRequired')).trim(),
        icon: z.string().min(1, t('validation.iconRequired')).trim(),
        color: z
          .string()
          .min(1, t('validation.colorRequired'))
          .trim()
          .refine((val) => isValidColor(val), {
            message: t('validation.colorInvalid'),
          }),
      }),
    [t]
  );

  const createDefaults = useMemo(
    (): CategoryFormData => ({
      label: '',
      key: '',
      icon: '',
      color: getDefaultColor(),
    }),
    []
  );

  const getEditValuesSync = useCallback(
    (id: string): CategoryFormData | undefined => {
      const category = storeCategories.find((cat) => cat.id === id);
      if (!category) return undefined;
      return {
        label: category.label,
        key: category.key,
        icon: category.icon,
        color: category.color,
      };
    },
    [storeCategories]
  );

  const { resetValues } = useEntityFormRowReset({
    editId,
    createValues: createDefaults,
    getEditValuesSync,
  });

  const buildPayload = useCallback(
    (data: CategoryFormData) => ({
      label: data.label.trim(),
      key: data.key.trim(),
      icon: data.icon.trim(),
      color: data.color.trim().toUpperCase(),
      group_id: groupId,
    }),
    [groupId]
  );

  const applyCreateOptimistic = useCallback(
    (payload: ReturnType<typeof buildPayload>) => {
      const tempId = getTempId('temp-category');
      const now = new Date().toISOString();
      const optimisticCategory: Category = {
        id: tempId,
        created_at: now,
        updated_at: now,
        ...payload,
      };
      addCategory(optimisticCategory);
      return tempId;
    },
    [addCategory]
  );

  const commitCreate = useCallback(
    (handle: string | { originalCategory: Category; id: string }, result: Category) => {
      if (typeof handle !== 'string') return;
      removeCategory(handle);
      addCategory(result);
    },
    [addCategory, removeCategory]
  );

  const rollbackCreate = useCallback(
    (handle: string | { originalCategory: Category; id: string }) => {
      if (typeof handle !== 'string') return;
      removeCategory(handle);
    },
    [removeCategory]
  );

  const applyUpdateOptimistic = useCallback(
    (id: string, payload: ReturnType<typeof buildPayload>) => {
      const originalCategory = storeCategories.find((cat) => cat.id === id);
      if (!originalCategory) {
        throw new Error(t('errors.notFound'));
      }
      updateCategory(id, {
        label: payload.label,
        icon: payload.icon,
        color: payload.color,
      });
      return { originalCategory, id };
    },
    [storeCategories, t, updateCategory]
  );

  const commitUpdate = useCallback(
    (handle: string | { originalCategory: Category; id: string }, result: Category) => {
      if (typeof handle === 'string') return;
      updateCategory(handle.id, result);
    },
    [updateCategory]
  );

  const rollbackUpdate = useCallback(
    (handle: string | { originalCategory: Category; id: string }) => {
      if (typeof handle === 'string') return;
      updateCategory(handle.id, handle.originalCategory);
    },
    [updateCategory]
  );

  const getSuccessToast = useCallback(
    (edit: boolean) =>
      edit
        ? { title: t('toast.updatedTitle'), description: t('toast.updatedDescription') }
        : { title: t('toast.createdTitle'), description: t('toast.createdDescription') },
    [t]
  );

  const formatErrorDescription = useCallback(
    (error: string, edit: boolean) =>
      edit
        ? `${error}\n\n${t('toast.revertedHint')}`
        : `${error}\n\n${t('toast.optimisticCreateFailedHint')}`,
    [t]
  );

  const handleSubmit = useEntityFormSubmit<
    CategoryFormData,
    ReturnType<typeof buildPayload>,
    Category,
    string | { originalCategory: Category; id: string }
  >({
    isEditMode,
    editId,
    onClose,
    buildPayload,
    createAction: (payload) => createCategoryAction(payload, locale),
    updateAction: (id, payload) =>
      updateCategoryAction(
        id,
        { label: payload.label, icon: payload.icon, color: payload.color },
        locale
      ),
    applyCreateOptimistic,
    commitCreate,
    rollbackCreate,
    applyUpdateOptimistic,
    commitUpdate,
    rollbackUpdate,
    getSuccessToast,
    errorToast: { title: t('toast.errorTitle') },
    formatErrorDescription,
    unknownErrorMessage: t('errors.unknown'),
  });

  return (
    <EntityFormModal<CategoryFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      schema={categorySchema}
      defaultValues={createDefaults}
      resetValues={resetValues ?? createDefaults}
      formClassName={categoryStyles.formModal.form}
      onSubmit={handleSubmit}
      footer={(_, isSubmitting) => (
        <ModalFooterActions
          variant="dual"
          cancelLabel={t('buttons.cancel')}
          submitLabel={isEditMode ? t('buttons.save') : t('buttons.create')}
          onCancel={onClose}
          submitType="submit"
          isSubmitting={isSubmitting}
        />
      )}
    >
      {(form) => <CategoryFormFields form={form} isEditMode={isEditMode} />}
    </EntityFormModal>
  );
}

export default CategoryFormModal;
