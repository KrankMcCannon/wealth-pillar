'use client';

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Checkbox } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formModalStyles as s } from '@/components/form/form-modal-styles';
import { ModalFieldError } from './modal-field-error';

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
  const fieldId = String(name);

  return (
    <div>
      <label htmlFor={fieldId} className={s.field.textShell}>
        <span className={cn(s.field.textLabel, 'min-w-0 flex-1 leading-snug')}>{label}</span>
        <Checkbox
          id={fieldId}
          checked={checked}
          onCheckedChange={(value) => field.onChange(value === true)}
          disabled={disabled}
          className={s.multiUser.checkbox}
        />
      </label>
      {hint ? <p className="px-4 pb-2 text-xs text-muted-foreground">{hint}</p> : null}
      {error?.message ? <ModalFieldError message={error.message} /> : null}
    </div>
  );
}
