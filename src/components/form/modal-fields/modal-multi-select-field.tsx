'use client';

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import type { User } from '@/lib/types';
import { MultiUserSelect } from '@/components/form/multi-user-select';
import { ModalFormField } from './modal-form-field';
import { ModalMultiSelectChips } from './modal-multi-select-chips';
import type { ModalSelectOption } from './modal-select-field';

export interface ModalMultiSelectFieldProps<T extends FieldValues, V extends string = string> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: ModalSelectOption<V>[];
  shape: 'rows' | 'chips';
  users?: User[];
  currentUserId?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
}

export function ModalMultiSelectField<T extends FieldValues, V extends string = string>({
  control,
  name,
  label,
  options,
  shape,
  users,
  currentUserId,
  disabled,
  searchPlaceholder,
}: Readonly<ModalMultiSelectFieldProps<T, V>>) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  const value = (field.value as string[]) ?? [];
  const handleChange = field.onChange;

  return (
    <ModalFormField
      label={label}
      {...(error?.message !== undefined ? { error: error.message } : {})}
    >
      {shape === 'rows' && users && currentUserId ? (
        <MultiUserSelect
          value={value}
          onChange={handleChange}
          users={users}
          currentUserId={currentUserId}
        />
      ) : (
        <ModalMultiSelectChips
          options={options}
          value={value}
          onChange={handleChange}
          {...(disabled !== undefined ? { disabled } : {})}
          {...(searchPlaceholder !== undefined ? { searchPlaceholder } : {})}
        />
      )}
    </ModalFormField>
  );
}
