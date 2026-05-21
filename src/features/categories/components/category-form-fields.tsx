'use client';

import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib';
import { getColorPalette } from '@/server/use-cases/categories/category.logic';
import { categoryStyles, getCategoryColorStyle } from '../theme/category-styles';
import {
  ModalIconField,
  ModalRootError,
  ModalTextField,
  ModalFieldError,
} from '@/components/form/modal-fields';
import { formModalStyles as s } from '@/components/form/form-modal-styles';
import { Input } from '@/components/ui/input';
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
  const { control, register, setValue, watch, formState } = form;
  const { errors, isSubmitting } = formState;

  const watchedLabel = watch('label');
  const watchedColor = watch('color');
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
      {errors.root?.message ? <ModalRootError message={errors.root.message} /> : null}

      <ModalTextField
        control={control}
        name="label"
        label={t('fields.label.label')}
        placeholder={t('fields.label.placeholder')}
        disabled={isSubmitting}
        {...(!isEditMode ? { hint: t('fields.label.helper') } : {})}
      />

      <ModalIconField
        control={control}
        name="icon"
        label={t('fields.icon.label')}
        disabled={isSubmitting}
      />

      <div className={s.noteShell}>
        <p className={s.noteLabel}>{t('fields.color.label')}</p>
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
            className={s.noteInput}
          />
        </div>
        {errors.color?.message ? <ModalFieldError message={errors.color.message} /> : null}
      </div>
    </ModalSection>
  );
}
