'use client';

import { useMemo, useState } from 'react';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import type { User } from '@/lib/types';
import { MultiUserSelect } from '@/components/form/multi-user-select';
import { ModalWrapper } from '@/components/ui/modal-wrapper';
import { ModalFieldError } from './modal-field-error';
import { ModalMultiSelectChips } from './modal-multi-select-chips';
import { ModalSelectorTrigger } from './modal-selector-trigger';
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

  if (shape === 'rows' && users && currentUserId) {
    return (
      <ModalMultiUserRow
        label={label}
        users={users}
        currentUserId={currentUserId}
        value={value}
        onChange={handleChange}
        {...(disabled !== undefined ? { disabled } : {})}
        {...(error?.message !== undefined ? { error: error.message } : {})}
      />
    );
  }

  return (
    <ModalMultiOptionRow
      label={label}
      options={options}
      value={value}
      onChange={handleChange}
      {...(disabled !== undefined ? { disabled } : {})}
      {...(error?.message !== undefined ? { error: error.message } : {})}
      {...(searchPlaceholder !== undefined ? { searchPlaceholder } : {})}
    />
  );
}

function ModalMultiUserRow({
  label,
  users,
  currentUserId,
  value,
  onChange,
  disabled,
  error,
}: {
  label: string;
  users: User[];
  currentUserId: string;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  error?: string;
}) {
  const t = useTranslations('Forms.MultiUser');
  const [open, setOpen] = useState(false);

  const summary = useMemo(() => {
    const selected = users.filter((user) => value.includes(user.id));
    if (selected.length === 0) return '';
    return selected
      .map((user) => {
        const name = user.name ?? '';
        return user.id === currentUserId ? `${name} ${t('currentUser')}`.trim() : name;
      })
      .filter(Boolean)
      .join(', ');
  }, [users, value, currentUserId, t]);

  return (
    <div>
      <ModalSelectorTrigger
        label={label}
        value={summary || t('placeholder')}
        valueMuted={!summary}
        {...(disabled !== undefined ? { disabled } : {})}
        onClick={() => setOpen(true)}
      />
      <ModalWrapper
        isOpen={open}
        onOpenChange={(next) => {
          if (!next) setOpen(false);
        }}
        title={label}
        nested
      >
        <MultiUserSelect
          value={value}
          onChange={onChange}
          users={users}
          currentUserId={currentUserId}
        />
      </ModalWrapper>
      {error ? <ModalFieldError message={error} /> : null}
    </div>
  );
}

function ModalMultiOptionRow({
  label,
  options,
  value,
  onChange,
  disabled,
  error,
  searchPlaceholder,
}: {
  label: string;
  options: ModalSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  error?: string;
  searchPlaceholder?: string;
}) {
  const t = useTranslations('Budgets.FormModal.fields.categories');
  const [open, setOpen] = useState(false);

  const summary = useMemo(() => {
    const selected = options.filter((option) => value.includes(option.value));
    if (selected.length === 0) return '';
    if (selected.length <= 2) return selected.map((option) => option.label).join(', ');
    return t('selectedCount', { count: selected.length });
  }, [options, value, t]);

  return (
    <div>
      <ModalSelectorTrigger
        label={label}
        value={summary || t('placeholder')}
        valueMuted={!summary}
        {...(disabled !== undefined ? { disabled } : {})}
        onClick={() => setOpen(true)}
      />
      <ModalWrapper
        isOpen={open}
        onOpenChange={(next) => {
          if (!next) setOpen(false);
        }}
        title={label}
        nested
        className="min-h-0 overflow-hidden"
      >
        <ModalMultiSelectChips
          options={options}
          value={value}
          onChange={onChange}
          {...(disabled !== undefined ? { disabled } : {})}
          {...(searchPlaceholder !== undefined ? { searchPlaceholder } : {})}
        />
      </ModalWrapper>
      {error ? <ModalFieldError message={error} /> : null}
    </div>
  );
}
