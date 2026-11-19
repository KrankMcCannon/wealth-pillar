'use client';

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { IconPicker } from '@/components/ui/icon-picker';
import { ModalFormField } from './modal-form-field';

export interface ModalIconFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  disabled?: boolean;
  color?: string | undefined;
}

export function ModalIconField<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  color,
}: Readonly<ModalIconFieldProps<T>>) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  return (
    <ModalFormField {...(error?.message !== undefined ? { error: error.message } : {})}>
      <IconPicker
        value={field.value ?? ''}
        disabled={disabled}
        label={label}
        color={color}
        onChange={disabled ? () => undefined : field.onChange}
      />
    </ModalFormField>
  );
}
