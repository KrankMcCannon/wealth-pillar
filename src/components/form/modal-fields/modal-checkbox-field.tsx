'use client';

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Checkbox } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formModalStyles as s } from '@/components/form/form-modal-styles';
import { ModalFormField } from './modal-form-field';

export interface ModalCheckboxFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
  hint?: string;
}

export function ModalCheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  hint,
}: Readonly<ModalCheckboxFieldProps<T>>) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  const checked = Boolean(field.value);

  return (
    <ModalFormField
      {...(error?.message !== undefined ? { error: error.message } : {})}
      {...(hint !== undefined ? { hint } : {})}
    >
      <label
        className={cn(
          s.multiUser.singleOption,
          checked && s.multiUser.singleOptionActive,
          disabled && 'pointer-events-none opacity-50'
        )}
      >
        <Checkbox
          checked={checked}
          onCheckedChange={(value) => field.onChange(value === true)}
          disabled={disabled}
        />
        <span className={s.multiUser.name}>{label}</span>
      </label>
    </ModalFormField>
  );
}
