'use client';

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
  hint,
}: Readonly<ModalSelectFieldProps<T, V>>) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  const handleValueChange = field.onChange;

  return (
    <div>
      <FormSelect
        value={field.value ?? ''}
        onValueChange={handleValueChange}
        options={options}
        captionLabel={label}
        {...(placeholder !== undefined ? { placeholder } : {})}
        {...(disabled !== undefined ? { disabled } : {})}
      />
      {hint ? <p className="px-4 pb-2 text-xs text-muted-foreground">{hint}</p> : null}
      {error?.message ? <ModalFieldError message={error.message} /> : null}
    </div>
  );
}
