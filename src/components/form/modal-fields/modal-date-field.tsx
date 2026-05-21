'use client';

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { DateField } from '@/components/ui/fields/date-field';

export interface ModalDateFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  required?: boolean;
}

export function ModalDateField<T extends FieldValues>({
  control,
  name,
  label,
  required,
}: Readonly<ModalDateFieldProps<T>>) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  const handleChange = field.onChange;

  return (
    <DateField
      value={field.value ?? ''}
      onChange={handleChange}
      label={label}
      {...(error?.message !== undefined ? { error: error.message } : {})}
      {...(required !== undefined ? { required } : {})}
    />
  );
}
