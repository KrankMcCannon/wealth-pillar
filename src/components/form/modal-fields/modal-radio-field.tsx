'use client';

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { ChoiceRadios, type ChoiceRadioOption } from './choice-radios';
import { ModalFieldError } from './modal-field-error';

export type ModalRadioOption = ChoiceRadioOption;

export interface ModalRadioFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: readonly ModalRadioOption[];
  disabled?: boolean | undefined;
  variant?: 'rows' | 'cards';
}

export function ModalRadioField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  disabled,
  variant = 'rows',
}: Readonly<ModalRadioFieldProps<T>>) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });
  const errorId = `${String(name)}-error`;

  return (
    <div>
      <ChoiceRadios
        name={String(name)}
        value={field.value ?? ''}
        onChange={field.onChange}
        options={options}
        label={label}
        variant={variant}
        disabled={disabled}
        invalid={Boolean(error?.message)}
        {...(error?.message ? { errorId } : {})}
      />
      {error?.message ? <ModalFieldError id={errorId} message={error.message} /> : null}
    </div>
  );
}
