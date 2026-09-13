'use client';

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { DateField } from '@/components/ui/fields/date-field';

export interface ModalDateFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  presentation?: 'drawer' | 'inline';
}

export function ModalDateField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  presentation = 'inline',
}: Readonly<ModalDateFieldProps<T>>) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  return (
    <DateField
      value={field.value ?? ''}
      onChange={field.onChange}
      label={label}
      presentation={presentation}
      {...(error?.message !== undefined ? { error: error.message } : {})}
      {...(required !== undefined ? { required } : {})}
    />
  );
}
