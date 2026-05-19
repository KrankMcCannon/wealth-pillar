'use client';

import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib';
import { getColorPalette } from '@/server/use-cases/categories/category.logic';
import { categoryStyles, getCategoryColorStyle } from '../theme/category-styles';
import { FormField } from '@/components/form';
import { IconPicker, Input } from '@/components/ui';
import { ModalSection } from '@/components/ui/modal-wrapper';

export type CategoryFormData = {
  label: string;
  key: string;
  icon: string;
  color: string;
};

interface CategoryFormFieldsProps {
  form: UseFormReturn<CategoryFormData>;
  isEditMode: boolean;
}

export function CategoryFormFields({ form, isEditMode }: CategoryFormFieldsProps) {
  const t = useTranslations('Categories.FormModal');
  const {
    register,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const watchedLabel = watch('label');
  const watchedColor = watch('color');
  const watchedIcon = watch('icon');
  const colorPalette = getColorPalette();

  useEffect(() => {
    if (!isEditMode && watchedLabel) {
      const generatedKey = watchedLabel
        .toLowerCase()
        .trim()
        .replaceAll(/[^a-z0-9]+/g, '_')
        .replaceAll(/(^_+)|(_+$)/g, '');
      setValue('key', generatedKey);
    }
  }, [watchedLabel, isEditMode, setValue]);

  return (
    <ModalSection>
      {errors.root ? (
        <div className={categoryStyles.formModal.error}>
          <p className="text-sm font-medium text-destructive">{errors.root.message}</p>
        </div>
      ) : null}

      <FormField
        label={t('fields.label.label')}
        required
        error={errors.label?.message}
        helperText={isEditMode ? undefined : t('fields.label.helper')}
      >
        <Input
          {...register('label')}
          placeholder={t('fields.label.placeholder')}
          disabled={isSubmitting}
        />
      </FormField>

      <FormField label={t('fields.icon.label')} required error={errors.icon?.message}>
        <IconPicker value={watchedIcon} onChange={(value) => setValue('icon', value)} />
      </FormField>

      <FormField label={t('fields.color.label')} required error={errors.color?.message}>
        <div className={categoryStyles.formModal.colorSection}>
          <div className={categoryStyles.formModal.palette}>
            {colorPalette.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setValue('color', color.value)}
                disabled={isSubmitting}
                className={cn(
                  categoryStyles.formModal.colorButton,
                  watchedColor.toUpperCase() === color.value.toUpperCase()
                    ? categoryStyles.formModal.colorActive
                    : categoryStyles.formModal.colorIdle,
                  isSubmitting && categoryStyles.formModal.colorDisabled
                )}
                style={getCategoryColorStyle(color.value)}
                title={color.name}
              >
                {watchedColor.toUpperCase() === color.value.toUpperCase() && (
                  <div className={categoryStyles.formModal.checkWrap}>
                    <svg
                      className={categoryStyles.formModal.checkIcon}
                      fill="none"
                      strokeWidth="3"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
          <Input
            {...register('color')}
            placeholder={t('fields.color.placeholder')}
            disabled={isSubmitting}
          />
        </div>
      </FormField>
    </ModalSection>
  );
}
