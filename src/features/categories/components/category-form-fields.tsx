'use client';

import { useEffect } from 'react';
import { Controller, useWatch, type UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib';
import { getColorPalette } from '@/server/use-cases/categories/category.logic';
import { categoryStyles, getCategoryColorStyle } from '../theme/category-styles';
import { ModalIconField, ModalTextField, ModalFieldError } from '@/components/form/modal-fields';
import { formModalStyles as s } from '@/components/form/form-modal-styles';
import { Input } from '@/components/ui/input';

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
  const { control, setValue, formState } = form;
  const { errors, isSubmitting } = formState;

  const watchedLabel = useWatch({ control, name: 'label' });
  const selectedColor = useWatch({ control, name: 'color' });
  const colorPalette = getColorPalette();

  const normalizedSelectedColor = selectedColor?.trim().toUpperCase() ?? '';

  useEffect(() => {
    if (!isEditMode && watchedLabel) {
      const generatedKey = watchedLabel
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replaceAll(/[^a-z0-9]+/g, '_')
        .replaceAll(/(^_+)|(_+$)/g, '');
      setValue('key', generatedKey || 'category');
    }
  }, [watchedLabel, isEditMode, setValue]);

  return (
    <>
      <div className={s.fieldStack}>
        <ModalTextField
          control={control}
          name="label"
          label={t('fields.label.label')}
          placeholder={t('fields.label.placeholder')}
          disabled={isSubmitting}
        />

        <ModalIconField
          control={control}
          name="icon"
          label={t('fields.icon.label')}
          disabled={isSubmitting}
        />

        <div className="flex min-w-0 flex-col gap-3 px-4 py-3">
          <label htmlFor="category-color" className={s.field.textLabel}>
            {t('fields.color.label')}
          </label>
          <div className={categoryStyles.formModal.colorSection}>
            <div
              className={categoryStyles.formModal.palette}
              role="radiogroup"
              aria-label={t('fields.color.label')}
            >
              {colorPalette.map((color) => {
                const isSelected = normalizedSelectedColor === color.value.toUpperCase();

                return (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() =>
                      setValue('color', color.value, { shouldDirty: true, shouldTouch: true })
                    }
                    disabled={isSubmitting}
                    aria-pressed={undefined}
                    role="radio"
                    tabIndex={isSelected ? 0 : -1}
                    onKeyDown={(event) => {
                      const step =
                        event.key === 'ArrowRight' || event.key === 'ArrowDown'
                          ? 1
                          : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                            ? -1
                            : 0;
                      if (!step) return;
                      event.preventDefault();
                      const index = colorPalette.findIndex(
                        (option) => option.value === color.value
                      );
                      const next =
                        colorPalette[(index + step + colorPalette.length) % colorPalette.length]!;
                      setValue('color', next.value, { shouldDirty: true, shouldTouch: true });
                      const buttons =
                        event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                          '[role="radio"]'
                        );
                      buttons?.[
                        (index + step + colorPalette.length) % colorPalette.length
                      ]?.focus();
                    }}
                    aria-checked={isSelected}
                    aria-label={color.name}
                    className={cn(
                      categoryStyles.formModal.colorButton,
                      isSelected
                        ? categoryStyles.formModal.colorActive
                        : categoryStyles.formModal.colorIdle,
                      isSubmitting && categoryStyles.formModal.colorDisabled
                    )}
                    style={getCategoryColorStyle(color.value)}
                    title={color.name}
                  >
                    {isSelected ? (
                      <div className={categoryStyles.formModal.checkWrap}>
                        <svg
                          className={categoryStyles.formModal.checkIcon}
                          fill="none"
                          strokeWidth="3"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <Controller
              control={control}
              name="color"
              render={({ field }) => (
                <Input
                  {...field}
                  id="category-color"
                  aria-invalid={!!errors.color}
                  aria-describedby={errors.color ? 'category-color-error' : undefined}
                  value={field.value ?? ''}
                  placeholder={t('fields.color.placeholder')}
                  disabled={isSubmitting}
                  className="w-full font-mono"
                />
              )}
            />
          </div>
          {errors.color?.message ? (
            <ModalFieldError id="category-color-error" message={errors.color.message} />
          ) : null}
        </div>
      </div>
    </>
  );
}
