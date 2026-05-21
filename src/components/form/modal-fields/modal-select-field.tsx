'use client';

import type { ReactNode } from 'react';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { FormSelect, type SelectOption } from '@/components/form/form-select';
import { ModalFieldError } from './modal-field-error';

export type ModalSelectOption<V extends string = string> = SelectOption & {
  value: V;
  color?: string | null;
};

export interface ModalSelectFieldProps<T extends FieldValues, V extends string = string> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: ModalSelectOption<V>[];
  placeholder?: string;
  disabled?: boolean;
  leadingIcon?: ReactNode;
  searchable?: boolean;
  hint?: string;
}

export function ModalSelectField<T extends FieldValues, V extends string = string>({
  control,
  name,
  label,
  options,
  placeholder,
  disabled,
  leadingIcon,
  hint,
}: Readonly<ModalSelectFieldProps<T, V>>) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  const handleValueChange = field.onChange;

  return (
    <div className="space-y-1">
      {hint ? <p className="px-1 text-xs text-modal-fg-muted">{hint}</p> : null}
      <FormSelect
        value={field.value ?? ''}
        onValueChange={handleValueChange}
        options={options}
        captionLabel={label}
        {...(placeholder !== undefined ? { placeholder } : {})}
        {...(disabled !== undefined ? { disabled } : {})}
        {...(leadingIcon !== undefined ? { leadingIcon } : {})}
      />
      {error?.message ? <ModalFieldError message={error.message} /> : null}
    </div>
  );
}
