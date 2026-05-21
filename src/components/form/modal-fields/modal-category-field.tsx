'use client';

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import type { Category } from '@/lib/types';
import { CategorySelect } from '@/components/form/category-select';
import { ModalFieldError } from './modal-field-error';

export interface ModalCategoryFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  categories: Category[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function ModalCategoryField<T extends FieldValues>({
  control,
  name,
  categories,
  label,
  placeholder,
  disabled,
}: Readonly<ModalCategoryFieldProps<T>>) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  const handleValueChange = field.onChange;

  return (
    <div className="space-y-1">
      <CategorySelect
        value={field.value ?? ''}
        onValueChange={handleValueChange}
        categories={categories}
        {...(placeholder !== undefined ? { placeholder } : {})}
        {...(disabled !== undefined ? { disabled } : {})}
        {...(label !== undefined ? { captionLabel: label } : {})}
      />
      {error?.message ? <ModalFieldError message={error.message} /> : null}
    </div>
  );
}
