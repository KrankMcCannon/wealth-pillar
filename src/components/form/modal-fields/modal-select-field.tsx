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
  searchable,
  hint,
}: Readonly<ModalSelectFieldProps<T, V>>) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });
  const errorId = `${String(name)}-error`;
  const hintId = `${String(name)}-hint`;

  return (
    <div aria-describedby={[hint ? hintId : null, error?.message ? errorId : null].filter(Boolean).join(' ') || undefined}>
      <FormSelect
        value={field.value ?? ''}
        onValueChange={field.onChange}
        options={options}
        captionLabel={label}
        searchable={searchable}
        {...(placeholder !== undefined ? { placeholder } : {})}
        {...(disabled !== undefined ? { disabled } : {})}
      />
      {hint ? (
        <p id={hintId} className="px-4 pb-2 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error?.message ? <ModalFieldError id={errorId} message={error.message} /> : null}
    </div>
  );
}
