'use client';

import { useMemo } from 'react';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import type { Category } from '@/lib';
import { getTempId } from '@/lib/utils/temp-id';
import { getDefaultColor, isValidColor } from '@/server/use-cases/categories/category.logic';
import { categoryStyles } from '../theme/category-styles';
import { createCategoryAction, updateCategoryAction } from '@/features/categories';
import { EntityFormModal } from '@/components/form/entity-form-modal';
import { FormActions } from '@/components/form';
import { useRequiredGroupId } from '@/hooks';
import { useCategories, useReferenceDataStore } from '@/stores/reference-data-store';
import { toast } from '@/hooks/use-toast';
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

  const isEditMode = !!editId;
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

  const createDefaults: CategoryFormData = useMemo(
    () => ({
      label: '',
      key: '',
      icon: '',
      color: getDefaultColor(),
    }),
    []
  );

  const resetValues = useMemo((): CategoryFormData => {
    if (isEditMode && editId) {
      const category = storeCategories.find((cat) => cat.id === editId);
      if (category) {
        return {
          label: category.label,
          key: category.key,
          icon: category.icon,
          color: category.color,
        };
      }
    }
    return createDefaults;
  }, [isEditMode, editId, storeCategories, createDefaults]);

  const handleUpdate = async (data: CategoryFormData, id: string) => {
    const updateData = {
      label: data.label.trim(),
      icon: data.icon.trim(),
      color: data.color.trim().toUpperCase(),
    };

    const originalCategory = storeCategories.find((cat) => cat.id === id);
    if (!originalCategory) {
      throw new Error(t('errors.notFound'));
    }

    updateCategory(id, updateData);

    const result = await updateCategoryAction(id, updateData, locale);

    if (result.error) {
      updateCategory(id, originalCategory);
      toast({
        title: t('toast.errorTitle'),
        description: `${result.error}\n\n${t('toast.revertedHint')}`,
        variant: 'destructive',
      });
      throw new Error(result.error);
    }

    if (result.data) {
      updateCategory(id, result.data);
      toast({
        title: t('toast.updatedTitle'),
        description: t('toast.updatedDescription'),
        variant: 'success',
      });
    }
  };

  const handleCreate = async (data: CategoryFormData) => {
    const tempId = getTempId('temp-category');
    const now = new Date().toISOString();
    const optimisticCategory: Category = {
      id: tempId,
      created_at: now,
      updated_at: now,
      label: data.label.trim(),
      key: data.key.trim(),
      icon: data.icon.trim(),
      color: data.color.trim().toUpperCase(),
      group_id: groupId,
    };

    addCategory(optimisticCategory);
    onClose();

    const result = await createCategoryAction(
      {
        label: data.label.trim(),
        key: data.key.trim(),
        icon: data.icon.trim(),
        color: data.color.trim().toUpperCase(),
        group_id: groupId,
      },
      locale
    );

    if (result.error) {
      removeCategory(tempId);
      toast({
        title: t('toast.errorTitle'),
        description: `${result.error}\n\n${t('toast.optimisticCreateFailedHint')}`,
        variant: 'destructive',
      });
      return;
    }

    removeCategory(tempId);
    if (result.data) {
      addCategory(result.data);
      toast({
        title: t('toast.createdTitle'),
        description: t('toast.createdDescription'),
        variant: 'success',
      });
    }
  };

  return (
    <EntityFormModal<CategoryFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      schema={categorySchema}
      defaultValues={createDefaults}
      resetValues={resetValues}
      repositionInputs={false}
      formClassName={categoryStyles.formModal.form}
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
      footer={(_, isSubmitting) => (
        <FormActions
          submitType="submit"
          submitLabel={isEditMode ? t('buttons.save') : t('buttons.create')}
          cancelLabel={t('buttons.cancel')}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          className="w-full sm:w-auto"
        />
      )}
    >
      {(form) => <CategoryFormFields form={form} isEditMode={isEditMode} />}
    </EntityFormModal>
  );
}

export default CategoryFormModal;
