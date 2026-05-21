'use client';

import { Search } from 'lucide-react';
import { formModalStyles as s } from '@/components/form/form-modal-styles';

export interface ModalSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
}

export function ModalSearchInput({
  value,
  onChange,
  placeholder,
  disabled,
  id,
  'aria-label': ariaLabel,
}: Readonly<ModalSearchInputProps>) {
  return (
    <div className={s.categorySearchWrap}>
      <Search className={s.categorySearchIcon} aria-hidden />
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={s.categorySearchInput}
        autoComplete="off"
        {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {})}
      />
    </div>
  );
}
