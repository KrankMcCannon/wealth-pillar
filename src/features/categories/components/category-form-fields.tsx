'use client';

import { useEffect, useId, useState } from 'react';
import { Controller, useWatch, type UseFormReturn } from 'react-hook-form';
import { Check, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getColorPalette, isValidColor } from '@/server/use-cases/categories/category.logic';
import { ModalIconField } from '@/components/form/modal-fields/modal-icon-field';
import { ModalFieldError } from '@/components/form/modal-fields/modal-field-error';
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
  const { control, register, setValue, formState } = form;
  const { errors, isSubmitting } = formState;
  const id = useId();
  const [showCustomColor, setShowCustomColor] = useState(false);
  const watchedLabel = useWatch({ control, name: 'label' });
  const selectedColor = useWatch({ control, name: 'color' });
  const colorPalette = getColorPalette();
  const normalizedColor = selectedColor?.trim().toUpperCase() ?? '';
  const validColor = isValidColor(normalizedColor) ? normalizedColor : undefined;
  const customColor = validColor && !colorPalette.some(({ value }) => value === validColor);
  const customColorOpen = showCustomColor || Boolean(errors.color);

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
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-base font-medium" htmlFor={`${id}-name`}>
          {t('fields.label.label')}
        </label>
        <Input
          {...register('label')}
          id={`${id}-name`}
          placeholder={t('fields.label.placeholder')}
          disabled={isSubmitting}
          aria-required
          aria-invalid={Boolean(errors.label)}
          aria-describedby={errors.label ? `${id}-name-error` : undefined}
          className="focus-visible:border-ring"
        />
        {errors.label?.message ? (
          <ModalFieldError id={`${id}-name-error`} message={errors.label.message} />
        ) : null}
      </div>

      <ModalIconField
        control={control}
        name="icon"
        label={t('fields.icon.label')}
        color={validColor}
        disabled={isSubmitting}
      />

      <Controller
        control={control}
        name="color"
        render={({ field }) => (
          <fieldset className="min-w-0 space-y-2" disabled={isSubmitting}>
            <legend className="mb-1 text-base font-medium">{t('fields.color.label')}</legend>
            <div className="mx-auto grid w-full max-w-96 grid-cols-[repeat(auto-fit,minmax(2.75rem,1fr))] gap-y-1">
              {colorPalette.map(({ value }) => {
                const isSelected = value === normalizedColor;
                return (
                  <label
                    key={value}
                    className="relative flex min-h-11 min-w-11 cursor-pointer items-center justify-center"
                  >
                    <input
                      type="radio"
                      name={`${id}-palette`}
                      value={value}
                      checked={isSelected}
                      onBlur={field.onBlur}
                      onChange={() => field.onChange(value)}
                      aria-label={t(`fields.color.names.${value.slice(1)}`)}
                      className="peer sr-only"
                    />
                    <span
                      className="flex size-7 items-center justify-center rounded-full border border-foreground/15 peer-checked:ring-2 peer-checked:ring-foreground peer-checked:ring-offset-2 peer-checked:ring-offset-background peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ring"
                      style={{ backgroundColor: value }}
                      aria-hidden
                    >
                      {isSelected ? (
                        <span className="grid size-4 place-items-center rounded-full bg-background text-foreground">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>

            <button
              type="button"
              aria-expanded={customColorOpen}
              aria-controls={customColorOpen ? `${id}-custom` : undefined}
              onClick={() => setShowCustomColor(!customColorOpen)}
              className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span className="flex-1">{t('fields.color.custom')}</span>
              {customColor ? (
                <span
                  className="size-4 rounded-full border border-foreground/15"
                  style={{ backgroundColor: validColor }}
                  aria-hidden
                />
              ) : null}
              <ChevronDown
                className={customColorOpen ? 'size-4 rotate-180' : 'size-4'}
                aria-hidden
              />
            </button>

            {customColorOpen ? (
              <div id={`${id}-custom`} className="flex flex-col gap-2">
                <label className="text-sm font-medium" htmlFor={`${id}-hex`}>
                  {t('fields.color.hex')}
                </label>
                <Input
                  {...field}
                  id={`${id}-hex`}
                  value={field.value ?? ''}
                  placeholder={t('fields.color.placeholder')}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={Boolean(errors.color)}
                  aria-describedby={errors.color ? `${id}-color-error` : undefined}
                  className="font-mono focus-visible:border-ring"
                />
                {errors.color?.message ? (
                  <ModalFieldError id={`${id}-color-error`} message={errors.color.message} />
                ) : null}
              </div>
            ) : null}
          </fieldset>
        )}
      />
    </div>
  );
}
